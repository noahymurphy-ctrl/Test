import { useEffect, useRef, useState } from 'react'
import Orb from './Orb.jsx'
import { haptic, sfx, unlockAudio } from '../lib/fx.js'
import { PALETTES } from '../lib/habits.js'

const FILL_MS = 650
const DRAIN_MS = 900
// Ticks bunch up as the orb fills — builds anticipation.
const TICKS = [0.14, 0.28, 0.4, 0.51, 0.61, 0.7, 0.78, 0.85, 0.91, 0.96]
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

export default function HabitOrb({ habit, count, streak, dim, onCommit, onOpen, onHint }) {
  const goal = habit.goal
  const base = Math.min(count, goal) / goal
  const complete = count >= goal
  const [level, setLevel] = useState(base)
  const [holding, setHolding] = useState(false)
  const [pop, setPop] = useState(0)
  const hold = useRef(null)
  const btn = useRef(null)

  useEffect(() => {
    if (!hold.current) setLevel(base)
  }, [base])

  useEffect(() => () => hold.current && cancelAnimationFrame(hold.current.raf), [])

  const finish = () => {
    const h = hold.current
    hold.current = null
    setHolding(false)
    setPop((n) => n + 1)
    onCommit(h.undo ? 0 : count + 1, btn.current.getBoundingClientRect())
  }

  const down = (e) => {
    if (e.button > 0 || hold.current) return
    unlockAudio()
    const undo = complete
    const to = undo ? 0 : (count + 1) / goal
    const h = { t0: performance.now(), from: base, to, x: e.clientX, y: e.clientY, ticks: 0, undo, raf: 0 }
    hold.current = h
    setHolding(true)
    haptic('light')
    const dur = undo ? DRAIN_MS : FILL_MS
    const loop = (now) => {
      if (hold.current !== h) return
      const p = Math.min(1, (now - h.t0) / dur)
      setLevel(h.from + (h.to - h.from) * ease(p))
      if (h.ticks < TICKS.length && p >= TICKS[h.ticks]) {
        h.ticks++
        haptic('tick')
        sfx.tick(h.ticks, undo)
      }
      if (p >= 1) finish()
      else h.raf = requestAnimationFrame(loop)
    }
    h.raf = requestAnimationFrame(loop)
  }

  const cancel = (quick) => {
    const h = hold.current
    if (!h) return
    cancelAnimationFrame(h.raf)
    hold.current = null
    setHolding(false)
    setLevel(base)
    if (quick && performance.now() - h.t0 < 220) onHint?.(btn.current)
  }

  const move = (e) => {
    const h = hold.current
    if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 14) cancel(false)
  }

  const p = PALETTES[habit.color] || PALETTES.grape

  return (
    <div className={`habit ${complete ? 'done' : ''} ${dim ? 'dim' : ''}`} style={{ '--c': p.mid, '--c-light': p.light, '--c-dark': p.dark }}>
      <button
        ref={btn}
        className={`orb-btn ${holding ? 'holding' : ''}`}
        onPointerDown={down}
        onPointerUp={() => cancel(true)}
        onPointerLeave={() => cancel(false)}
        onPointerCancel={() => cancel(false)}
        onPointerMove={move}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
            e.preventDefault()
            unlockAudio()
            setPop((n) => n + 1)
            onCommit(complete ? 0 : count + 1, btn.current.getBoundingClientRect())
          }
        }}
        aria-label={`${habit.name}: ${count} of ${goal}. Press and hold to ${complete ? 'undo' : 'check in'}.`}
      >
        <span className="orb-glow" />
        <span key={pop} className={`orb-body ${pop ? 'pop' : ''}`}>
          <Orb color={habit.color} level={level} agitated={holding} animate={!holding} />
          <span className="orb-emoji">{habit.emoji}</span>
          {goal > 1 && (
            <span className="orb-count">
              {Math.min(count, 999)}
              <small>/{goal}</small>
            </span>
          )}
          {complete && goal === 1 && <span className="orb-check">✓</span>}
        </span>
      </button>
      <button className="habit-label" onClick={onOpen}>
        <span className="habit-name">{habit.name || 'Untitled'}</span>
        <span className={`habit-streak ${streak > 0 ? 'on' : ''}`}>
          {streak > 0 ? <>🔥 {streak}</> : <span className="muted">No streak yet</span>}
        </span>
      </button>
    </div>
  )
}
