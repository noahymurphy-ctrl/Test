/** Circular progress ring. */
export default function Ring({ value, size = 44, stroke = 5, color = 'url(#ringGrad)', track = 'var(--track)', children, className = '' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <span className={`ring ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.34,1.56,.64,1)', opacity: v > 0 ? 1 : 0 }}
        />
      </svg>
      {children != null && <span className="ring-label">{children}</span>}
    </span>
  )
}

/** Shared gradient defs used by rings across the app. */
export function RingDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd25e" />
          <stop offset="0.5" stopColor="#ff6aa2" />
          <stop offset="1" stopColor="#8a6bff" />
        </linearGradient>
      </defs>
    </svg>
  )
}
