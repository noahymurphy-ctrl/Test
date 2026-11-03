import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { fmtParts } from '../lib/money'
import { haptic, useToasts, dismissToast } from '../lib/fx'

export function Avatar({ member, size = 44, ring = false, className = '' }) {
  const m = member || { emoji: '👻', color: '#ddd' }
  return (
    <div
      className={`relative grid shrink-0 place-items-center rounded-full ${ring ? 'ring-[3px] ring-accent ring-offset-2 ring-offset-bg' : ''} ${className}`}
      style={{ width: size, height: size, background: m.color, fontSize: size * 0.52, lineHeight: 1 }}
      aria-hidden
    >
      <span style={{ transform: 'translateY(4%)' }}>{m.emoji}</span>
    </div>
  )
}

/** Big pretty money: small symbol, bold whole, softer cents. */
export function Money({ cents, currency, className = '', fracClass = 'opacity-60', symClass = 'opacity-80' }) {
  const { symbol, whole, frac, symbolFirst } = fmtParts(cents, currency)
  return (
    <span className={`num whitespace-nowrap ${className}`}>
      {symbolFirst && <span className={symClass}>{symbol}</span>}
      {whole}
      <span className={fracClass}>{frac}</span>
      {!symbolFirst && <span className={symClass}> {symbol}</span>}
    </span>
  )
}

export function AnimatedMoney({ cents, ...rest }) {
  const [shown, setShown] = useState(cents)
  const from = useRef(cents)
  useEffect(() => {
    const start = from.current
    if (start === cents) return
    const t0 = performance.now()
    let raf
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 700)
      const e = 1 - Math.pow(1 - p, 3)
      const v = Math.round(start + (cents - start) * e)
      from.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [cents])
  return <Money cents={shown} {...rest} />
}

export function Segmented({ value, onChange, options, className = '' }) {
  const i = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className={`relative grid rounded-[14px] bg-bg-2 p-1 ${className}`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }} role="tablist">
      <div
        className="absolute top-1 bottom-1 left-1 rounded-[11px] bg-card shadow-card transition-transform duration-300 ease-ios"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${i * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => {
            haptic()
            onChange(o.value)
          }}
          className={`relative z-10 flex h-9 items-center justify-center gap-1.5 text-[14px] font-semibold transition-colors ${o.value === value ? 'text-ink' : 'text-ink-2'}`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        haptic()
        onChange(!checked)
      }}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300 ${checked ? 'bg-pos' : 'bg-bg-2'}`}
    >
      <span
        className="absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform duration-300 ease-spring"
        style={{ transform: checked ? 'translateX(20px)' : 'none' }}
      />
    </button>
  )
}

export function SectionTitle({ children, action }) {
  return (
    <div className="mt-7 mb-2.5 flex items-end justify-between px-1">
      <h2 className="title text-[20px] font-bold">{children}</h2>
      {action}
    </div>
  )
}

export function Empty({ emoji, title, body, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="float mb-3 text-[56px]">{emoji}</div>
      <div className="title text-[19px] font-bold">{title}</div>
      {body && <p className="mt-1.5 max-w-[300px] text-[15px] leading-snug text-ink-2">{body}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}

export function IconButton({ children, label, onClick, className = '' }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={`press grid h-10 w-10 place-items-center rounded-full bg-card-2 text-ink ${className}`}>
      {children}
    </button>
  )
}

export function Sheet({ open, onClose, children, label = 'Dialog', title, right }) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const panel = useRef(null)
  const drag = useRef(null)

  if (open && !mounted) setMounted(true)
  if (open && closing) setClosing(false)
  if (!open && mounted && !closing) setClosing(true)

  useEffect(() => {
    if (!closing) return
    const t = setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, 290)
    return () => clearTimeout(t)
  }, [closing])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!mounted) return
    document.body.style.overflow = 'hidden'
    document.body.dataset.sheets = String(Number(document.body.dataset.sheets || 0) + 1)
    return () => {
      const n = Number(document.body.dataset.sheets || 1) - 1
      document.body.dataset.sheets = String(n)
      if (n <= 0) document.body.style.overflow = ''
    }
  }, [mounted])

  useEffect(() => {
    if (open && mounted) panel.current?.focus({ preventScroll: true })
  }, [open, mounted])

  if (!mounted) return null

  const isMobile = () => window.innerWidth < 768
  const onDown = (e) => {
    if (!isMobile() || e.target.closest('button,input,textarea,select,a')) return
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    panel.current.style.transition = 'none'
  }
  const onMove = (e) => {
    if (!drag.current) return
    const dy = Math.max(0, e.clientY - drag.current.y)
    drag.current.dy = dy
    panel.current.style.transform = `translateY(${dy}px)`
  }
  const onUp = () => {
    if (!drag.current) return
    const { dy, t } = drag.current
    drag.current = null
    const v = dy / (performance.now() - t)
    const el = panel.current
    if (dy > 140 || (v > 0.6 && dy > 30)) {
      onClose?.()
    } else {
      el.style.transition = 'transform .35s cubic-bezier(.32,.72,0,1)'
      el.style.transform = ''
    }
  }

  return createPortal(
    <>
      <div className="sheet-backdrop" data-closing={closing || undefined} onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="sheet outline-none"
        data-closing={closing || undefined}
      >
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} className="shrink-0 touch-none">
          <div className="mx-auto mt-2 h-[5px] w-10 rounded-full bg-ink-3/40 md:hidden" />
          <div className="flex min-h-[52px] items-center gap-3 px-5 pt-2 md:pt-4">
            <div className="title min-w-0 flex-1 truncate text-[19px] font-bold">{title}</div>
            {right}
            <IconButton label="Close" onClick={onClose} className="h-8 w-8">
              <X size={17} strokeWidth={2.6} />
            </IconButton>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
      </div>
    </>,
    document.body,
  )
}

export function Toaster() {
  const toasts = useToasts()
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 z-[80] flex flex-col items-center gap-2 px-4 bottom-[calc(var(--sab)+96px)] md:bottom-8">
      {toasts.map((t) => (
        <div key={t.id} className="pop pointer-events-auto flex max-w-[420px] items-center gap-3 rounded-2xl bg-ink py-3 pr-3 pl-4 text-[15px] font-medium text-bg shadow-2xl">
          {t.icon && <span className="text-[18px]">{t.icon}</span>}
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              className="rounded-xl px-3 py-1.5 font-bold text-[#b9afff] dark:text-[#5b4bff]"
              onClick={() => {
                t.onAction?.()
                dismissToast(t.id)
              }}
            >
              {t.action}
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body,
  )
}

export function Chip({ selected, onClick, children, className = '' }) {
  return (
    <button
      onClick={() => {
        haptic()
        onClick()
      }}
      aria-pressed={selected}
      className={`press flex shrink-0 items-center gap-2 rounded-full border-[1.5px] py-1.5 pr-3.5 pl-1.5 text-[15px] font-semibold transition-colors ${selected ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-card text-ink-2'} ${className}`}
    >
      {children}
    </button>
  )
}
