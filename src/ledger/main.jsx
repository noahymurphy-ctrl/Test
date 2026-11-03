import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Track the on-screen keyboard so sheets can stay above it on iPhone.
const vv = window.visualViewport
if (vv) {
  const sync = () => {
    const kb = Math.max(0, window.innerHeight - vv.height)
    document.documentElement.style.setProperty('--kb', `${kb > 80 ? kb : 0}px`)
  }
  vv.addEventListener('resize', sync)
  sync()
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' })
      const announce = (w) => window.dispatchEvent(new CustomEvent('evenly:update', { detail: w }))
      if (reg.waiting && navigator.serviceWorker.controller) announce(reg.waiting)
      reg.addEventListener('updatefound', () => {
        const w = reg.installing
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) announce(w)
        })
      })
      let reloading = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return
        reloading = true
        location.reload()
      })
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reg.update().catch(() => {}))
    } catch (err) {
      console.warn('Service worker registration failed', err)
    }
  })
}
