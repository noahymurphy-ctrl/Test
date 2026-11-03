import { useId } from 'react'
import { PALETTES } from '../lib/habits.js'

// One period of the wave is 50 units wide so a -50 translate loops seamlessly.
const WAVE = (() => {
  let d = 'M -100 0'
  for (let x = -100; x < 250; x += 50) d += ` Q ${x + 12.5} -5 ${x + 25} 0 T ${x + 50} 0`
  return d + ' V 140 H -100 Z'
})()

/** A glossy glass orb filled with liquid up to `level` (0–1). Purely visual. */
export default function Orb({ color, level = 0, agitated = false, animate = true }) {
  const p = PALETTES[color] || PALETTES.grape
  const uid = useId().replace(/:/g, '')
  const top = level <= 0 ? 112 : level >= 1 ? -10 : 97 - level * 90

  return (
    <svg className={`orb ${agitated ? 'agitated' : ''}`} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <clipPath id={`c${uid}`}>
          <circle cx="50" cy="50" r="46" />
        </clipPath>
        <radialGradient id={`b${uid}`} cx="50%" cy="38%" r="65%">
          <stop offset="0" stopColor={p.mid} stopOpacity="0.22" />
          <stop offset="1" stopColor={p.dark} stopOpacity="0.38" />
        </radialGradient>
        <linearGradient id={`l${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={p.light} />
          <stop offset="0.45" stopColor={p.mid} />
          <stop offset="1" stopColor={p.dark} />
        </linearGradient>
        <radialGradient id={`g${uid}`} cx="34%" cy="24%" r="38%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`s${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0.78" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="46" fill={`url(#b${uid})`} className="orb-base" />

      <g clipPath={`url(#c${uid})`}>
        <g className="liquid" style={{ transform: `translateY(${top}px)`, transition: animate ? undefined : 'none' }}>
          <path className="wave back" d={WAVE} fill={p.mid} opacity="0.55" />
          <path className="wave front" d={WAVE} fill={`url(#l${uid})`} />
        </g>
        <circle cx="50" cy="50" r="46" fill={`url(#s${uid})`} />
      </g>

      <ellipse cx="38" cy="27" rx="25" ry="15" fill={`url(#g${uid})`} transform="rotate(-24 38 27)" />
      <circle cx="50" cy="50" r="45.5" fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="1" />
    </svg>
  )
}
