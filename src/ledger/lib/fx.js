// Little moments of delight: toasts, confetti, haptics.
import { useSyncExternalStore } from 'react'

// ---- toasts
let toasts = []
const tl = new Set()
const emitT = () => tl.forEach((l) => l())
export function toast(message, { action, onAction, icon, duration = 3800 } = {}) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts.slice(-2), { id, message, action, onAction, icon }]
  emitT()
  setTimeout(() => dismissToast(id), duration)
  haptic()
}
export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id)
  emitT()
}
export function useToasts() {
  return useSyncExternalStore(
    (l) => (tl.add(l), () => tl.delete(l)),
    () => toasts,
  )
}

// ---- haptics (Android vibrates; iOS ignores politely)
export function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* noop */
  }
}

// ---- confetti
const COLORS = ['#6D5BFF', '#FF5C8A', '#FFB020', '#22C38E', '#38BDF8', '#F472B6']
export function celebrate({ x = 0.5, y = 0.35, count = 140 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const c = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  c.width = innerWidth * dpr
  c.height = innerHeight * dpr
  Object.assign(c.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 })
  document.body.appendChild(c)
  const ctx = c.getContext('2d')
  ctx.scale(dpr, dpr)
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2
    const v = 6 + Math.random() * 9
    return {
      x: innerWidth * x,
      y: innerHeight * y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 7,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      round: Math.random() < 0.3,
    }
  })
  const start = performance.now()
  const tick = (now) => {
    const t = now - start
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    for (const p of parts) {
      p.vy += 0.32
      p.vx *= 0.985
      p.vy *= 0.985
      p.x += p.vx
      p.y += p.vy
      p.r += p.vr
      ctx.save()
      ctx.globalAlpha = Math.max(0, 1 - t / 2600)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.r)
      ctx.fillStyle = p.c
      if (p.round) {
        ctx.beginPath()
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
        ctx.fill()
      } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)))
      ctx.restore()
    }
    if (t < 2600) requestAnimationFrame(tick)
    else c.remove()
  }
  requestAnimationFrame(tick)
  haptic([10, 40, 10])
}
