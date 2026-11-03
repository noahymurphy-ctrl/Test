import { useSyncExternalStore } from 'react'

const DATA_KEY = 'evenly.data'
const LOCAL_KEY = 'evenly.local'

export const uid = (n = 16) => {
  const abc = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const bytes = crypto.getRandomValues(new Uint8Array(n))
  return Array.from(bytes, (b) => abc[b % 62]).join('')
}

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked; keep running in memory */
  }
}

// ---------------------------------------------------------------- state
let records = read(DATA_KEY, {}) // synced: members, txns, meta
let local = read(LOCAL_KEY, {}) // device-only: me, sync config, theme…
let sync = { state: local.sync ? 'connecting' : 'off' }
let snapshot = derive()
const listeners = new Set()

function derive() {
  const all = Object.values(records)
  const memberMap = {}
  const members = []
  const txns = []
  for (const r of all) {
    if (r.kind === 'member') {
      memberMap[r.id] = r
      if (!r.deleted) members.push(r)
    } else if (r.kind === 'txn' && !r.deleted) txns.push(r)
  }
  members.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  txns.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0))
  const meta = { name: 'Our Family', currency: 'USD', simplify: true, ...(records.meta || {}) }
  const me = local.me && memberMap[local.me] && !memberMap[local.me].deleted ? local.me : null
  return { records, local, sync, members, memberMap, txns, meta, me }
}

function emit() {
  snapshot = derive()
  listeners.forEach((l) => l())
}

export function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getState = () => snapshot

export function useStore(selector = (s) => s) {
  return selector(useSyncExternalStore(subscribe, getState))
}

// ---------------------------------------------------------------- writes
export function put(rec) {
  const now = Date.now()
  const next = { createdAt: now, ...records[rec.id], ...rec, updatedAt: Math.max(now, (records[rec.id]?.updatedAt || 0) + 1) }
  records = { ...records, [next.id]: next }
  write(DATA_KEY, records)
  emit()
  if (conn) conn.push(next).catch(onSyncError)
  return next
}

export function remove(id) {
  if (records[id]) put({ id, deleted: true })
}

export function restore(id) {
  if (records[id]) put({ id, deleted: false })
}

export function setLocal(patch) {
  local = { ...local, ...patch }
  write(LOCAL_KEY, local)
  emit()
}

export function replaceAll(nextRecords) {
  records = nextRecords
  write(DATA_KEY, records)
  emit()
}

function merge(remote) {
  let changed = false
  const next = { ...records }
  for (const r of remote) {
    if (!r?.id) continue
    const cur = next[r.id]
    if (!cur || (r.updatedAt || 0) > (cur.updatedAt || 0)) {
      next[r.id] = r
      changed = true
    }
  }
  if (changed) {
    records = next
    write(DATA_KEY, records)
    emit()
  }
}

// Keep multiple Mac browser tabs in step.
window.addEventListener('storage', (e) => {
  if (e.key === DATA_KEY) {
    records = read(DATA_KEY, {})
    emit()
  } else if (e.key === LOCAL_KEY) {
    local = read(LOCAL_KEY, {})
    emit()
  }
})

// ---------------------------------------------------------------- sync
let conn = null
let connecting = null

function setSync(s) {
  sync = s
  emit()
}

function onSyncError(err) {
  console.error(err)
  setSync({ state: 'error', message: friendlyError(err) })
}

function friendlyError(err) {
  const m = String(err?.code || err?.message || err)
  if (m.includes('admin-restricted') || m.includes('operation-not-allowed'))
    return 'Turn on Anonymous sign-in in Firebase → Authentication → Sign-in method.'
  if (m.includes('permission-denied') || m.includes('PERMISSION_DENIED'))
    return 'Firestore blocked the request. Double-check the security rules.'
  if (m.includes('api-key') || m.includes('invalid-api-key')) return 'That Firebase config looks wrong (API key rejected).'
  if (m.includes('not-found') || m.includes('NOT_FOUND')) return 'No Firestore database found. Create one in the Firebase console.'
  return err?.message || 'Something went wrong syncing.'
}

export async function startSync() {
  if (!local.sync || conn || connecting) return
  const { config, familyId } = local.sync
  setSync({ state: 'connecting' })
  connecting = (async () => {
    try {
      const { connect } = await import('./firebase.js')
      const c = await connect(config, familyId)
      if (local.sync?.familyId !== familyId) return c.stop()
      conn = c
      let first = true
      c.listen(
        (remote, offline) => {
          if (first) {
            first = false
            const byId = Object.fromEntries(remote.map((r) => [r.id, r]))
            const newer = Object.values(records).filter((l) => !byId[l.id] || (l.updatedAt || 0) > (byId[l.id].updatedAt || 0))
            if (newer.length) c.pushMany(newer).catch(onSyncError)
          }
          merge(remote)
          setSync({ state: offline ? 'offline' : 'live', at: Date.now() })
        },
        onSyncError,
      )
    } catch (err) {
      onSyncError(err)
    } finally {
      connecting = null
    }
  })()
  return connecting
}

export async function stopSync() {
  const c = conn
  conn = null
  if (connecting) await connecting.catch(() => {})
  if (c) await c.stop().catch(() => {})
  if (conn) {
    const c2 = conn
    conn = null
    await c2.stop().catch(() => {})
  }
}

export async function enableSync(config, familyId) {
  await stopSync()
  setLocal({ sync: { config, familyId } })
  return startSync()
}

export async function leaveSync() {
  await stopSync()
  setLocal({ sync: null })
  setSync({ state: 'off' })
}

export async function retrySync() {
  await stopSync()
  return startSync()
}

// Reconnect promptly when the app comes back to the foreground / online.
window.addEventListener('online', () => sync.state === 'error' && retrySync())

// ---------------------------------------------------------------- backup
export function exportData() {
  return JSON.stringify({ app: 'evenly', version: 1, exportedAt: new Date().toISOString(), records }, null, 2)
}

export function importData(text) {
  const parsed = JSON.parse(text)
  if (parsed?.app !== 'evenly' || typeof parsed.records !== 'object') throw new Error('Not an Evenly backup file')
  const incoming = Object.values(parsed.records).map((r) => ({ ...r, updatedAt: Math.max(r.updatedAt || 0, Date.now()) }))
  const next = { ...records }
  for (const r of incoming) next[r.id] = r
  replaceAll(next)
  if (conn) conn.pushMany(incoming).catch(onSyncError)
  return incoming.length
}

export function resetEverything() {
  stopSync()
  records = {}
  local = { theme: local.theme }
  write(DATA_KEY, records)
  write(LOCAL_KEY, local)
  sync = { state: 'off' }
  emit()
}

// Ask the browser not to evict our data.
navigator.storage?.persist?.().catch(() => {})
