export function Logo({ size = 64, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="lg-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d5bff" />
          <stop offset=".55" stopColor="#a35bff" />
          <stop offset="1" stopColor="#ff6fb1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="26" fill="url(#lg-bg)" />
      <rect x="24" y="33" width="52" height="12" rx="6" fill="#fff" />
      <rect x="24" y="55" width="52" height="12" rx="6" fill="#fff" opacity=".85" />
    </svg>
  )
}
