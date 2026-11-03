import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Cloud, CloudOff, Download, ExternalLink, Laptop, Link2, Moon, RefreshCw, Share, Smartphone, Sun, Upload, UserRound, Users } from 'lucide-react'
import { Avatar, Segmented, Sheet, Toggle } from '../components/ui'
import { enableSync, exportData, getState, importData, leaveSync, put, resetEverything, retrySync, setLocal, uid, useStore } from '../lib/store'
import { CURRENCIES } from '../lib/money'
import { makeInvite, parseConfig } from '../lib/invite'
import { useNav } from '../lib/nav'
import { celebrate, toast } from '../lib/fx'
import { timeAgo } from '../lib/dates'

export default function Settings() {
  const { meta, memberMap, me, local, sync, members } = useStore()
  const nav = useNav()
  const fileRef = useRef(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)
  const theme = local.theme || 'system'

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `evenly-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast('Backup saved', { icon: '💾' })
  }

  const onImport = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const n = importData(await f.text())
      toast(`Restored ${n} items`, { icon: '✅' })
    } catch (err) {
      toast(err.message || 'Could not read that file', { icon: '⚠️' })
    }
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <header className="pt-2 pb-4">
        <h1 className="title text-[34px] leading-tight font-extrabold">Settings</h1>
      </header>

      <Group title="Family">
        <Row icon={<Users size={19} />} tint="#6d5bff" label="Family name">
          <input
            className="min-w-0 flex-1 bg-transparent text-right font-medium text-ink-2 outline-none focus:text-ink"
            defaultValue={meta.name}
            key={meta.name}
            onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== meta.name && put({ id: 'meta', kind: 'meta', name: e.target.value.trim() })}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            maxLength={40}
          />
        </Row>
        <Row icon={<span className="text-[15px] font-bold">$</span>} tint="#12a874" label="Currency">
          <select
            value={meta.currency}
            onChange={(e) => put({ id: 'meta', kind: 'meta', currency: e.target.value })}
            className="appearance-none bg-transparent text-right font-medium text-ink-2 outline-none"
          >
            {CURRENCIES.map(([c, n]) => (
              <option key={c} value={c}>
                {c} · {n}
              </option>
            ))}
          </select>
        </Row>
        <Row icon={<UserRound size={19} />} tint="#ff7a59" label="You are" onClick={nav.openIdentity}>
          <span className="flex items-center gap-2 font-medium text-ink-2">
            {memberMap[me] && <Avatar member={memberMap[me]} size={26} />}
            {memberMap[me]?.name || 'Not set'}
          </span>
          <ChevronRight size={18} className="text-ink-3" />
        </Row>
        <Row icon={<span className="text-[16px]">🪄</span>} tint="#ffb020" label="Simplify debts" sub="Fewest payments to settle everyone up">
          <Toggle checked={meta.simplify} label="Simplify debts" onChange={(v) => put({ id: 'meta', kind: 'meta', simplify: v })} />
        </Row>
      </Group>

      <Group title="Family sync" footer={syncFooter(local, sync)}>
        {local.sync ? (
          <>
            <Row
              icon={sync.state === 'error' ? <CloudOff size={19} /> : <Cloud size={19} />}
              tint={sync.state === 'live' ? '#12a874' : sync.state === 'error' ? '#f0476b' : '#ffb020'}
              label={{ live: 'Synced', connecting: 'Connecting…', offline: 'Offline — will sync later', error: 'Sync problem' }[sync.state] || 'Sync'}
              sub={sync.state === 'error' ? sync.message : sync.at ? `Updated ${timeAgo(sync.at)}` : null}
            >
              {sync.state === 'error' && (
                <button className="btn btn-soft h-9 px-3 text-[14px]" onClick={retrySync}>
                  <RefreshCw size={15} /> Retry
                </button>
              )}
            </Row>
            <Row icon={<Link2 size={19} />} tint="#6d5bff" label="Invite family" onClick={() => setInviteOpen(true)}>
              <ChevronRight size={18} className="text-ink-3" />
            </Row>
            <Row
              icon={<CloudOff size={19} />}
              tint="#a19eb3"
              label="Turn off sync on this device"
              onClick={() => confirm('Stop syncing on this device? Your data stays here, but changes won’t be shared anymore.') && leaveSync()}
            />
          </>
        ) : (
          <Row icon={<Cloud size={19} />} tint="#38bdf8" label="Set up family sync" sub="Share one ledger across everyone’s phones" onClick={() => setSetupOpen(true)}>
            <ChevronRight size={18} className="text-ink-3" />
          </Row>
        )}
      </Group>

      <Group title="Appearance">
        <div className="p-3">
          <Segmented
            value={theme}
            onChange={(v) => setLocal({ theme: v })}
            options={[
              { value: 'system', label: 'Auto', icon: <Laptop size={15} /> },
              { value: 'light', label: 'Light', icon: <Sun size={15} /> },
              { value: 'dark', label: 'Dark', icon: <Moon size={15} /> },
            ]}
          />
        </div>
      </Group>

      <Group title="App">
        <Row icon={<Smartphone size={19} />} tint="#111" label="Install on iPhone or Mac" onClick={() => setInstallOpen(true)}>
          <ChevronRight size={18} className="text-ink-3" />
        </Row>
        <Row icon={<Download size={19} />} tint="#12a874" label="Export backup" onClick={download} />
        <Row icon={<Upload size={19} />} tint="#38bdf8" label="Import backup" onClick={() => fileRef.current?.click()} />
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
        <Row
          icon={<span className="text-[15px]">🧨</span>}
          tint="#f0476b"
          label={<span className="text-neg">Erase everything on this device</span>}
          onClick={() => {
            if (confirm('Erase all Evenly data on this device? This can’t be undone.') && confirm('Really erase? Export a backup first if you might want it.')) resetEverything()
          }}
        />
      </Group>

      <p className="py-6 text-center text-[13px] text-ink-3">
        Evenly · {members.length} {members.length === 1 ? 'person' : 'people'} · made for families who like things fair 💜
        <br />
        <span className="opacity-70">Shortcuts on Mac: N new · S settle · 1–4 tabs · / search</span>
      </p>

      <SyncSetupSheet open={setupOpen} onClose={() => setSetupOpen(false)} onDone={() => (setSetupOpen(false), setInviteOpen(true))} />
      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <InstallSheet open={installOpen} onClose={() => setInstallOpen(false)} />
    </div>
  )
}

function syncFooter(local, sync) {
  if (local.sync) return sync.state === 'live' ? 'Changes appear on everyone’s devices within a second.' : null
  return 'Right now everything lives only on this device. Turn on sync so each family member can use Evenly on their own phone or Mac.'
}

function Group({ title, footer, children }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-4 text-[13px] font-semibold tracking-wide text-ink-2 uppercase">{title}</h2>
      <div className="card overflow-hidden [&>*+*]:border-t [&>*+*]:border-line">{children}</div>
      {footer && <p className="mt-2 px-4 text-[13px] leading-snug text-ink-3">{footer}</p>}
    </section>
  )
}

function Row({ icon, tint, label, sub, children, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={`flex min-h-[54px] w-full items-center gap-3 px-4 py-2.5 text-left ${onClick ? 'row-press' : ''}`}>
      <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] text-white" style={{ background: tint }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-medium">{label}</span>
        {sub && <span className="block text-[13px] leading-snug text-ink-3">{sub}</span>}
      </span>
      {children}
    </Tag>
  )
}

const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /families/{familyId}/records/{id} {
      allow read, write: if request.auth != null
                         && familyId.size() >= 20;
    }
  }
}`

function SyncSetupSheet({ open, onClose, onDone }) {
  const { meta } = useStore()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const config = parseConfig(text)
  const copy = async (s) => {
    await navigator.clipboard.writeText(s).catch(() => {})
    toast('Copied', { icon: '📋' })
  }
  const connect = async () => {
    setBusy(true)
    const familyId = uid(24)
    await enableSync(config, familyId)
    setBusy(false)
    const s = getState().sync
    if (s.state === 'error') return toast(s.message, { icon: '⚠️', duration: 7000 })
    put({ id: 'meta', kind: 'meta', name: meta.name })
    celebrate()
    toast('Family sync is on!', { icon: '☁️' })
    onDone()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Set up family sync" label="Set up family sync">
      <div className="flex flex-col gap-4 text-[15px] leading-relaxed">
        <p className="text-ink-2">
          Evenly syncs through a free Google Firebase project that <b className="text-ink">you</b> own — your family’s data never touches anyone else’s server. One-time setup, about 5 minutes:
        </p>
        <ol className="flex flex-col gap-3">
          <Step n={1}>
            Go to{' '}
            <a className="font-semibold text-accent underline" href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">
              console.firebase.google.com <ExternalLink size={13} className="inline" />
            </a>{' '}
            and create a project (turn Analytics off).
          </Step>
          <Step n={2}>
            <b>Build → Authentication</b> → Get started → <b>Sign-in method</b> → enable <b>Anonymous</b>.
          </Step>
          <Step n={3}>
            <b>Build → Firestore Database</b> → Create database (production mode). Open <b>Rules</b>, paste these, then Publish:
            <pre className="mt-2 overflow-x-auto rounded-xl bg-card-2 p-3 text-[12px] leading-snug">{RULES}</pre>
            <button className="mt-1.5 text-[14px] font-semibold text-accent" onClick={() => copy(RULES)}>
              Copy rules
            </button>
          </Step>
          <Step n={4}>
            <b>Project settings</b> (gear) → <b>Your apps</b> → add a Web app <span className="font-mono">{'</>'}</span>. Copy the <span className="font-mono">firebaseConfig</span> it shows and paste it here:
          </Step>
        </ol>
        <textarea
          className="field font-mono text-[13px]"
          rows={5}
          placeholder={'const firebaseConfig = {\n  apiKey: "…",\n  projectId: "…",\n  appId: "…"\n}'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <div className={`-mt-2 text-[13px] font-semibold ${config ? 'text-pos' : 'text-ink-3'}`}>
          {config ? `✓ Found project “${config.projectId}”` : text ? 'Can’t find apiKey, projectId and appId yet…' : ' '}
        </div>
        <button className="btn btn-primary w-full" disabled={!config || busy} onClick={connect}>
          <Cloud size={19} /> {busy ? 'Connecting…' : 'Turn on sync'}
        </button>
      </div>
    </Sheet>
  )
}

function Step({ n, children }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[14px] font-bold text-accent">{n}</span>
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </li>
  )
}

function InviteSheet({ open, onClose }) {
  const { local, meta } = useStore()
  const invite = local.sync ? makeInvite({ ...local.sync, name: meta.name }) : null
  const share = async () => {
    const text = `Join “${meta.name}” on Evenly so we can keep track of who owes who 💜`
    try {
      if (navigator.share) await navigator.share({ title: 'Join our family on Evenly', text, url: invite.url })
      else {
        await navigator.clipboard.writeText(invite.url)
        toast('Invite link copied', { icon: '🔗' })
      }
    } catch {
      /* cancelled */
    }
  }
  return (
    <Sheet open={open} onClose={onClose} title="Invite family" label="Invite family">
      {invite && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[15px] text-ink-2">Have them scan this with their iPhone camera, or send them the link.</p>
          <QR text={invite.url} />
          <div className="grid w-full grid-cols-2 gap-2.5">
            <button className="btn btn-primary" onClick={share}>
              <Share size={19} /> Share link
            </button>
            <button
              className="btn btn-ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(invite.url).catch(() => {})
                toast('Invite link copied', { icon: '🔗' })
              }}
            >
              <Link2 size={19} /> Copy
            </button>
          </div>
          <div className="w-full rounded-2xl bg-card-2 p-3.5 text-left text-[13.5px] leading-snug text-ink-2">
            <b className="text-ink">After opening the link:</b> tap Share → <b>Add to Home Screen</b> to install. If the installed app asks, choose <b>Join with invite</b> and paste the same link.
            <br />
            <span className="mt-1.5 block text-ink-3">🔒 Anyone with this link can see and edit your family’s ledger — only share it with family.</span>
          </div>
        </div>
      )}
    </Sheet>
  )
}

export function QR({ text, size = 220 }) {
  const [cells, setCells] = useState(null)
  useEffect(() => {
    let alive = true
    import('qrcode-generator').then(({ default: qrcode }) => {
      const q = qrcode(0, 'M')
      q.addData(text)
      q.make()
      const n = q.getModuleCount()
      const out = []
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) out.push([c, r])
      if (alive) setCells({ n, out })
    })
    return () => {
      alive = false
    }
  }, [text])
  return (
    <div className="pop rounded-[28px] bg-white p-4 shadow-card" style={{ width: size + 32, height: size + 32 }}>
      {cells && (
        <svg viewBox={`-1 -1 ${cells.n + 2} ${cells.n + 2}`} width={size} height={size} role="img" aria-label="Invite QR code">
          <defs>
            <linearGradient id="qrg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4a3aff" />
              <stop offset="1" stopColor="#b23aff" />
            </linearGradient>
          </defs>
          {cells.out.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} rx={0.3} fill="url(#qrg)" />
          ))}
        </svg>
      )}
    </div>
  )
}

function InstallSheet({ open, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title="Install Evenly" label="Install Evenly">
      <div className="flex flex-col gap-4 text-[15px] leading-relaxed">
        <div className="card p-4">
          <div className="mb-1 flex items-center gap-2 font-bold">
            <Smartphone size={18} /> iPhone
          </div>
          Open this page in <b>Safari</b>, tap the <b>Share</b> button <Share size={14} className="inline" />, then <b>Add to Home Screen</b>. Evenly opens full-screen, works offline, and feels like a real app.
        </div>
        <div className="card p-4">
          <div className="mb-1 flex items-center gap-2 font-bold">
            <Laptop size={18} /> MacBook
          </div>
          In <b>Safari</b>: File menu → <b>Add to Dock</b>. In <b>Chrome</b>: the install icon at the right of the address bar. It gets its own window and Dock icon.
        </div>
      </div>
    </Sheet>
  )
}
