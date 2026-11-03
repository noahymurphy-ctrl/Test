/* Evenly service worker — generated at build time. */
const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const CACHE = `evenly-${VERSION}`
const RUNTIME = 'evenly-runtime'
const SITE = new URL('../', self.registration.scope).href // e.g. https://host/Test/
const APP = self.registration.scope // e.g. https://host/Test/ledger/

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((p) => new URL(p, SITE).href))),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('evenly-') && k !== CACHE && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // App shell: serve instantly from cache, refresh in the background.
  if (req.mode === 'navigate' && url.href.startsWith(APP)) {
    event.respondWith(
      caches.match(APP, { ignoreSearch: true }).then((cached) => {
        const fresh = fetch(req)
          .then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(APP, res.clone()))
            return res
          })
          .catch(() => cached)
        return cached || fresh
      }),
    )
    return
  }

  // Hashed build assets never change: cache-first.
  if (url.pathname.includes('/assets/') || url.href.startsWith(APP)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(RUNTIME).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
  }
})
