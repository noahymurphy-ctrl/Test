import Orb from './Orb.jsx'
import Heatmap from './Heatmap.jsx'
import Ring from './Ring.jsx'
import { PALETTES, bestStreak, countOf, daySummary, isDue, perfectDays, rate, streak } from '../lib/habits.js'
import { key } from '../lib/dates.js'

export default function Progress({ s, onOpen }) {
  const { habits, log } = s
  const checkins = Object.values(log).reduce((a, d) => a + Object.values(d).reduce((x, y) => x + y, 0), 0)
  const best = habits.reduce((m, h) => Math.max(m, bestStreak(h, log)), 0)
  const perfect = perfectDays(habits, log)
  const avg = habits.length ? habits.reduce((a, h) => a + rate(h, log, 30), 0) / habits.length : 0

  return (
    <div className="progress">
      <header className="top">
        <div>
          <p className="eyebrow">Your glow</p>
          <h1>Progress</h1>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat big">
          <Ring value={avg} size={64} stroke={7}>
            {Math.round(avg * 100)}%
          </Ring>
          <span>30-day average</span>
        </div>
        <div className="stat big">
          <b>✨ {perfect}</b>
          <span>Perfect days</span>
        </div>
        <div className="stat big">
          <b>🏆 {best}</b>
          <span>Best streak</span>
        </div>
        <div className="stat big">
          <b>✔︎ {checkins}</b>
          <span>Check-ins</span>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Every day, all habits</h3>
        <Heatmap
          weeks={20}
          color="linear-gradient(135deg, #ffd25e, #ff6aa2 55%, #8a6bff)"
          value={(d) => {
            const sum = daySummary(habits, log, d)
            return sum.due ? sum.frac : null
          }}
        />
      </div>

      {habits.length > 0 && <h3 className="section-title">Habits</h3>}
      <div className="habit-rows">
        {habits.map((h) => {
          const p = PALETTES[h.color]
          const r = rate(h, log, 30)
          return (
            <button key={h.id} className="habit-row" onClick={() => onOpen(h.id)} style={{ '--c': p.mid, '--c-light': p.light }}>
              <span className="mini-orb">
                <Orb color={h.color} level={0.55} />
                <span>{h.emoji}</span>
              </span>
              <span className="row-main">
                <b>{h.name}</b>
                <span className="bar">
                  <span style={{ width: `${Math.max(3, r * 100)}%` }} />
                </span>
                <Heatmap
                  weeks={12}
                  cell={7}
                  color={`linear-gradient(135deg, ${p.light}, ${p.mid})`}
                  value={(d) => {
                    const n = countOf(log, key(d), h.id)
                    if (n) return Math.min(1, n / h.goal)
                    return isDue(h, d) ? 0 : null
                  }}
                />
              </span>
              <span className="row-side">
                <b>🔥 {streak(h, log)}</b>
                <small>{Math.round(r * 100)}%</small>
              </span>
            </button>
          )
        })}
      </div>
      {!habits.length && <p className="empty-note">Add a habit and your progress will glow here.</p>}
    </div>
  )
}
