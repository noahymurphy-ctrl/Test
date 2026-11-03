import { addDays, key, today } from '../lib/dates.js'

/** GitHub-style grid: one column per week, oldest on the left. `value(date)` returns 0–1 or null (not scheduled). */
export default function Heatmap({ weeks = 18, value, color = 'var(--accent)', cell = 0 }) {
  const end = today()
  const startOfThisWeek = addDays(end, -end.getDay())
  const cols = []
  for (let w = weeks - 1; w >= 0; w--) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(startOfThisWeek, -w * 7 + d)
      if (date > end) {
        col.push(<span key={d} className="hm-cell future" />)
        continue
      }
      const v = value(date)
      col.push(
        <span
          key={d}
          className={`hm-cell ${v == null ? 'off' : ''} ${key(date) === key(end) ? 'today' : ''}`}
          style={v ? { background: color, opacity: 0.25 + 0.75 * v } : undefined}
        />,
      )
    }
    cols.push(
      <span key={w} className="hm-col">
        {col}
      </span>,
    )
  }
  return (
    <div className="heatmap" style={cell ? { '--cell': `${cell}px` } : undefined}>
      {cols}
    </div>
  )
}
