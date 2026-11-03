// An invite packs the (public) Firebase web config + the secret family id into
// a link. Anyone with the link can join, so share it only with family.

const b64url = {
  enc: (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => {
    const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0)))
  },
}

export function makeInvite({ config, familyId, name }) {
  const { apiKey, authDomain, projectId, appId } = config
  const code = b64url.enc(JSON.stringify({ v: 1, f: familyId, n: name, c: { apiKey, authDomain, projectId, appId } }))
  const base = `${location.origin}${location.pathname}`
  return { code, url: `${base}#join=${code}` }
}

export function parseInvite(text) {
  if (!text) return null
  const m = String(text).trim().match(/(?:join=)?([A-Za-z0-9_-]{40,})/)
  if (!m) return null
  try {
    const o = JSON.parse(b64url.dec(m[1]))
    if (o?.v !== 1 || !o.f || !o.c?.apiKey) return null
    return { familyId: o.f, name: o.n, config: o.c }
  } catch {
    return null
  }
}

/** Accepts the JSON or the `const firebaseConfig = {…}` snippet from the console. */
export function parseConfig(text) {
  const keys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
  const out = {}
  for (const k of keys) {
    const m = String(text).match(new RegExp(`["']?${k}["']?\\s*:\\s*["']([^"']+)["']`))
    if (m) out[k] = m[1]
  }
  if (!out.apiKey || !out.projectId || !out.appId) return null
  return out
}
