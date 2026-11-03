// Haptics, synthesized sounds and particle effects.

let settings = { sound: true, haptics: true }
export const configureFx = (s) => {
  settings = s
}

/* ---------------- Haptics ----------------
 * Android/Chrome: navigator.vibrate.
 * iPhone (iOS 18+): Safari has no vibrate API, but toggling a native
 * <input switch> plays the system haptic tick — so we click a hidden one.
 */
let switchLabel = null
function getSwitch() {
  if (switchLabel) return switchLabel
  const label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.body.appendChild(label)
  switchLabel = label
  return label
}

const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
const VIBES = { tick: 5, light: 10, medium: 18, heavy: 32, success: [14, 60, 14, 60, 30], error: [30, 70, 30] }
const TAPS = { tick: 1, light: 1, medium: 1, heavy: 2, success: 3, error: 2 }

export function haptic(kind = 'light') {
  if (!settings.haptics) return
  if (canVibrate) {
    try {
      navigator.vibrate(VIBES[kind] ?? 10)
    } catch {
      /* ignore */
    }
    return
  }
  const el = getSwitch()
  el.click()
  for (let i = 1; i < (TAPS[kind] || 1); i++) setTimeout(() => el.click(), i * 75)
}

/* ---------------- Sound ---------------- */
let ctx = null
let master = null

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
}

function tone({ f = 440, f2, type = 'sine', t = 0, dur = 0.12, vol = 0.3, attack = 0.004 }) {
  if (!ctx || !settings.sound) return
  const now = ctx.currentTime + t
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, now)
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + dur)
  g.gain.setValueAtTime(0.0001, now)
  g.gain.linearRampToValueAtTime(vol, now + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  o.connect(g).connect(master)
  o.start(now)
  o.stop(now + dur + 0.03)
}

function noise({ t = 0, dur = 0.08, vol = 0.15, freq = 2000 }) {
  if (!ctx || !settings.sound) return
  const now = ctx.currentTime + t
  const len = Math.ceil(ctx.sampleRate * dur)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2
  const src = ctx.createBufferSource()
  src.buffer = buf
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = freq
  const g = ctx.createGain()
  g.gain.value = vol
  src.connect(bp).connect(g).connect(master)
  src.start(now)
}

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
export const sfx = {
  tick(i, down = false) {
    const step = PENTA[Math.min(i, PENTA.length - 1)]
    tone({ f: 440 * 2 ** ((down ? -step : step) / 12), type: 'triangle', dur: 0.06, vol: 0.16 })
  },
  pop(big = false) {
    tone({ f: big ? 1300 : 950, f2: big ? 170 : 260, dur: big ? 0.22 : 0.15, vol: 0.5 })
    noise({ dur: 0.05, vol: big ? 0.25 : 0.15, freq: 3000 })
    if (big) [1047, 1319, 1568].forEach((f, i) => tone({ f, type: 'triangle', t: 0.07 + i * 0.065, dur: 0.28, vol: 0.13 }))
  },
  undo() {
    tone({ f: 520, f2: 150, dur: 0.25, vol: 0.32 })
    noise({ dur: 0.12, vol: 0.06, freq: 600 })
  },
  fanfare() {
    ;[523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone({ f, type: 'triangle', t: i * 0.075, dur: 0.45, vol: 0.14 }))
    tone({ f: 2093, t: 0.48, dur: 1.1, vol: 0.07 })
  },
  soft() {
    tone({ f: 880, type: 'sine', dur: 0.05, vol: 0.1 })
  },
  whoosh() {
    noise({ dur: 0.18, vol: 0.12, freq: 900 })
  },
}

/* ---------------- Particles ---------------- */
let canvas = null
let c2 = null
let parts = []
let rings = []
let raf = 0
let last = 0

function ensureCanvas() {
  if (canvas) return
  canvas = document.createElement('canvas')
  canvas.className = 'fx-canvas'
  document.body.appendChild(canvas)
  c2 = canvas.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
}

function resize() {
  const d = Math.min(window.devicePixelRatio || 1, 3)
  canvas.width = innerWidth * d
  canvas.height = innerHeight * d
  c2.setTransform(d, 0, 0, d, 0, 0)
}

const pick = (a) => a[(Math.random() * a.length) | 0]

export function burst(x, y, colors, { count = 24, power = 1, radius = 0 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ensureCanvas()
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = (2.5 + Math.random() * 6) * power
    parts.push({
      x: x + Math.cos(a) * radius * 0.85,
      y: y + Math.sin(a) * radius * 0.85,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 2 * power,
      g: 0.22,
      drag: 0.955,
      life: 1,
      decay: 0.014 + Math.random() * 0.02,
      size: 2 + Math.random() * 4.5 * power,
      color: pick(colors),
      shape: Math.random() < 0.25 ? 'star' : 'dot',
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
    })
  }
  rings.push({ x, y, r: radius * 0.9, max: radius + 70 * power, life: 1, color: colors[1] || colors[0] })
  start()
}

export function confetti(colors) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ensureCanvas()
  const w = innerWidth
  for (let i = 0; i < 160; i++) {
    const fromLeft = i % 2 === 0
    parts.push({
      x: fromLeft ? -10 : w + 10,
      y: innerHeight * (0.55 + Math.random() * 0.25),
      vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 9),
      vy: -(10 + Math.random() * 10),
      g: 0.28,
      drag: 0.975,
      life: 1,
      decay: 0.004 + Math.random() * 0.004,
      size: 6 + Math.random() * 6,
      color: pick(colors),
      shape: 'paper',
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.35,
      wob: Math.random() * 10,
    })
  }
  start()
}

function start() {
  if (raf) return
  last = performance.now()
  raf = requestAnimationFrame(frame)
}

function star(ctx, r) {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * 0.4 : r
    const a = (i * Math.PI) / 4
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fill()
}

function frame(now) {
  const dt = Math.min(3, (now - last) / 16.667)
  last = now
  c2.clearRect(0, 0, innerWidth, innerHeight)

  for (const r of rings) {
    r.life -= 0.045 * dt
    r.r += (r.max - r.r) * 0.16 * dt
    if (r.life <= 0) continue
    c2.globalAlpha = Math.max(0, r.life) * 0.7
    c2.strokeStyle = r.color
    c2.lineWidth = 3 * r.life + 0.5
    c2.beginPath()
    c2.arc(r.x, r.y, r.r, 0, Math.PI * 2)
    c2.stroke()
  }
  rings = rings.filter((r) => r.life > 0)

  for (const p of parts) {
    p.vx *= p.drag ** dt
    p.vy = p.vy * p.drag ** dt + p.g * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rot += p.vr * dt
    p.life -= p.decay * dt
    if (p.life <= 0) continue
    c2.globalAlpha = Math.min(1, p.life * 1.6)
    c2.fillStyle = p.color
    c2.save()
    c2.translate(p.x, p.y)
    c2.rotate(p.rot)
    if (p.shape === 'paper') {
      p.wob += 0.15 * dt
      c2.fillRect(-p.size / 2, (-p.size / 4) * Math.abs(Math.cos(p.wob)), p.size, (p.size / 2) * Math.abs(Math.cos(p.wob)) + 0.5)
    } else if (p.shape === 'star') {
      star(c2, p.size * 1.2)
    } else {
      c2.beginPath()
      c2.arc(0, 0, p.size, 0, Math.PI * 2)
      c2.fill()
    }
    c2.restore()
  }
  parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40)
  c2.globalAlpha = 1

  if (parts.length || rings.length) raf = requestAnimationFrame(frame)
  else {
    raf = 0
    c2.clearRect(0, 0, innerWidth, innerHeight)
  }
}
