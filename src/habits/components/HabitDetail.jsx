import { useState } from 'react'
import Orb from './Orb.jsx'
import Heatmap from './Heatmap.jsx'
import { PALETTES, bestStreak, countOf, isDue, rate, streak, totalDone } from '../lib/habits.js'
import { WEEKDAYS, fromKey, key, monthName, today } from '../lib/dates.js'
import { haptic, sfx } from '../lib/fx.js'

export default function HabitDetail({ habit, log, dispatch, todayKey, onEdit, onClose }) {
  const [month, setMonth] = useState(() => {
    const d = today()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [confirm, setConfirm] = useState(false)
  const p = PALETTES[habit.color]
  const cur = streak(habit, log)
  const best = bestStreak(habit, log)
  const pct = Math.round(rate(habit, log, 30) * 100)
  const todayCount = countOf(log, todayKey, habit.id)

  const setCount = (dayKey, n) => dispatch({ type: 'set', day: dayKey, id: habit.id, count: Math.max(0, n) })

  // month grid
  const first = month.getDay()
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(<span key={`b${i}`} />)
  for (let d = 1; d <= daysIn; d++) {
    const date = new Date(month.getFullYear(), month.getMonth(), d)
    const k = key(date)
    const n = countOf(log, k, habit.id)
    const future = k > todayKey
    const frac = Math.min(1, n / habit.goal)
    cells.push(
      <button
        key={k}
        disabled={future}
        className={`cal-day ${frac >= 1 ? 'done' : frac > 0 ? 'part' : ''} ${isDue(habit, date) ? 'due' : 'rest'} ${k === todayKey ? 'today' : ''}`}
        style={frac > 0 && frac < 1 ? { '--f': `${frac * 360}deg` } : undefined}
        onClick={() => {
          const next = n >= habit.goal ? 0 : habit.goal
          setCount(k, next)
          if (next) {
            haptic('medium')
            sfx.pop(false)
          } else {
            haptic('light')
            sfx.undo()
          }
        }}
      >
        {d}
      </button>,
    )
  }

  const shiftMonth = (by) => {
    haptic('tick')
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + by, 1))
  }
  const atCurrentMonth = month.getFullYear() === today().getFullYear() && month.getMonth() === today().getMonth()

  return (
    <div className="detail" style={{ '--c': p.mid, '--c-light': p.light, '--c-dark': p.dark }}>
      <div className="detail-hero">
        <span className="orb-glow" />
        <Orb color={habit.color} level={Math.min(1, todayCount / habit.goal)} />
        <span className="orb-emoji">{habit.emoji}</span>
      </div>
      <h2 className="detail-name">{habit.name}</h2>
      <p className="detail-sub">
        {habit.goal > 1 ? `${habit.goal}× a day` : 'Once a day'} ·{' '}
        {habit.days.every(Boolean) ? 'every day' : habit.days.map((v, i) => (v ? WEEKDAYS[i] : null)).filter(Boolean).join(' ')}
      </p>

      {habit.goal > 1 && (
        <div className="stepper today-stepper">
          <button onClick={() => (haptic('light'), sfx.undo(), setCount(todayKey, todayCount - 1))} disabled={!todayCount}>
            −
          </button>
          <span>
            Today <b>{todayCount}</b>/{habit.goal}
          </span>
          <button onClick={() => (haptic('medium'), sfx.pop(todayCount + 1 === habit.goal), setCount(todayKey, todayCount + 1))}>+</button>
        </div>
      )}

      <div className="stat-row">
        <div className="stat">
          <b>🔥 {cur}</b>
          <span>Current streak</span>
        </div>
        <div className="stat">
          <b>🏆 {best}</b>
          <span>Best streak</span>
        </div>
        <div className="stat">
          <b>{totalDone(habit, log)}</b>
          <span>Days done</span>
        </div>
        <div className="stat">
          <b>{pct}%</b>
          <span>Last 30 days</span>
        </div>
      </div>

      <div className="card">
        <div className="cal-head">
          <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            ‹
          </button>
          <b>{monthName(month)}</b>
          <button className="icon-btn" onClick={() => shiftMonth(1)} disabled={atCurrentMonth} aria-label="Next month">
            ›
          </button>
        </div>
        <div className="cal-grid cal-dow">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="cal-grid">{cells}</div>
        <p className="hint">Tap a day to fill or clear it.</p>
      </div>

      <div className="card">
        <h3 className="card-title">Last 6 months</h3>
        <Heatmap
          weeks={26}
          color={`linear-gradient(135deg, ${p.light}, ${p.mid})`}
          value={(d) => {
            const n = countOf(log, key(d), habit.id)
            if (n) return Math.min(1, n / habit.goal)
            return isDue(habit, d) ? 0 : null
          }}
        />
      </div>

      <div className="detail-actions">
        <button className="big-btn ghost" onClick={onEdit}>
          Edit habit
        </button>
        <button
          className={`big-btn danger ${confirm ? 'armed' : ''}`}
          onClick={() => {
            if (!confirm) {
              haptic('medium')
              setConfirm(true)
              setTimeout(() => setConfirm(false), 3000)
              return
            }
            haptic('heavy')
            sfx.whoosh()
            dispatch({ type: 'remove', id: habit.id })
            onClose()
          }}
        >
          {confirm ? 'Tap again to delete' : 'Delete habit'}
        </button>
      </div>
      <p className="hint center">Started {fromKey(habit.created).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
  )
}
