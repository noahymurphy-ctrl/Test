import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** iOS-style bottom sheet with swipe-down to dismiss. */
export default function Sheet({ open, onClose, onExited, children }) {
  const [shown, setShown] = useState(false)
  const [dy, setDy] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef(null)

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      return () => cancelAnimationFrame(id)
    }
    const t = setTimeout(() => {
      setShown(false)
      setDy(0)
      onExited?.()
    }, 340)
    return () => clearTimeout(t)
  }, [open, onExited])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const start = (e) => {
    drag.current = { y: e.clientY, t: performance.now() }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e) => drag.current && setDy(Math.max(0, e.clientY - drag.current.y))
  const end = (e) => {
    if (!drag.current) return
    const v = (e.clientY - drag.current.y) / (performance.now() - drag.current.t)
    drag.current = null
    setDragging(false)
    if (dy > 120 || v > 0.6) onClose()
    else setDy(0)
  }

  return createPortal(
    <div className={`sheet-wrap ${open && shown ? 'in' : ''}`} aria-hidden={!open}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className={`sheet ${dragging ? 'dragging' : ''}`}
        role="dialog"
        aria-modal="true"
        style={open && dy ? { transform: `translateY(${dy}px)` } : undefined}
      >
        <div className="sheet-grab" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          <span />
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
