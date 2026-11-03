import { addDays, fromKey, key, today } from './dates.js'

// light → mid → dark, used for the liquid gradient, glow and particles
export const PALETTES = {
  ember: { light: '#ffb27a', mid: '#ff6a3d', dark: '#d43a1a', name: 'Ember' },
  sun: { light: '#ffe98a', mid: '#ffc53d', dark: '#e08b00', name: 'Sun' },
  lime: { light: '#d8ff7a', mid: '#8ee04f', dark: '#3e9f2b', name: 'Lime' },
  mint: { light: '#a6ffe0', mid: '#2fe3a5', dark: '#0f9a70', name: 'Mint' },
  aqua: { light: '#8af3ff', mid: '#2fc3f7', dark: '#1272cc', name: 'Aqua' },
  indigo: { light: '#a8b4ff', mid: '#6070ff', dark: '#3138c9', name: 'Indigo' },
  grape: { light: '#dca6ff', mid: '#a35bff', dark: '#6029c9', name: 'Grape' },
  rose: { light: '#ffa8cd', mid: '#ff5797', dark: '#c71f5d', name: 'Rose' },
}
export const PALETTE_IDS = Object.keys(PALETTES)

export const EMOJIS = [
  '💧', '📖', '🧘', '🏃', '🦷', '😴', '🥦', '📵', '🏋️', '🚶', '✍️', '🎸',
  '🧹', '💊', '☀️', '🌙', '🍎', '🚭', '🧠', '💰', '🙏', '🛏️', '🎨', '🐶',
  '🌱', '🚴', '🏊', '🎧', '📝', '☕', '❤️', '📞', '🧊', '🥗', '🗣️', '🎯',
  '🧴', '🪴', '🎹', '💻',
]

export const STARTERS = [
  { name: 'Drink water', emoji: '💧', color: 'aqua', goal: 8 },
  { name: 'Read', emoji: '📖', color: 'sun', goal: 1 },
  { name: 'Meditate', emoji: '🧘', color: 'grape', goal: 1 },
  { name: 'Move', emoji: '🏃', color: 'ember', goal: 1 },
  { name: 'Floss', emoji: '🦷', color: 'mint', goal: 1 },
  { name: 'Eat greens', emoji: '🥦', color: 'lime', goal: 1 },
  { name: 'No phone in bed', emoji: '📵', color: 'indigo', goal: 1 },
  { name: 'Journal', emoji: '✍️', color: 'rose', goal: 1 },
]

export const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365, 500, 1000]

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const EVERY_DAY = [true, true, true, true, true, true, true]

export function newHabit(partial = {}, index = 0) {
  return {
    id: uid(),
    name: '',
    emoji: EMOJIS[index % EMOJIS.length],
    color: PALETTE_IDS[index % PALETTE_IDS.length],
    goal: 1,
    days: [...EVERY_DAY],
    created: key(today()),
    ...partial,
  }
}

export const countOf = (log, dayKey, id) => log[dayKey]?.[id] || 0
export const isDue = (h, date) => !!h.days[date.getDay()]
const isDone = (h, log, d) => countOf(log, key(d), h.id) >= h.goal

function firstDay(h, log) {
  let first = h.created
  for (const k in log) if (log[k][h.id] && k < first) first = k
  return fromKey(first)
}

/** Consecutive scheduled days completed. Today only counts once done; skipped rest days don't break it. */
export function streak(h, log, from = today()) {
  const start = firstDay(h, log)
  let d = new Date(from)
  if (!isDone(h, log, d)) d = addDays(d, -1)
  let n = 0
  for (let i = 0; i < 4000 && d >= start; i++) {
    if (isDone(h, log, d)) n++
    else if (isDue(h, d)) break
    d = addDays(d, -1)
  }
  return n
}

export function bestStreak(h, log, to = today()) {
  let d = firstDay(h, log)
  let run = 0
  let best = 0
  const end = key(to)
  for (let i = 0; i < 4000 && key(d) <= end; i++) {
    if (isDone(h, log, d)) best = Math.max(best, ++run)
    else if (isDue(h, d) && key(d) !== end) run = 0
    d = addDays(d, 1)
  }
  return best
}

export function totalDone(h, log) {
  let n = 0
  for (const k in log) if ((log[k][h.id] || 0) >= h.goal) n++
  return n
}

/** Share of scheduled days completed over the last `days` days (since the habit began). */
export function rate(h, log, days = 30, to = today()) {
  const start = firstDay(h, log)
  let due = 0
  let done = 0
  for (let i = 0; i < days; i++) {
    const d = addDays(to, -i)
    if (d < start) break
    const ok = isDone(h, log, d)
    if (isDue(h, d) || ok) {
      if (i === 0 && !ok) continue // today isn't over yet
      due++
      if (ok) done++
    }
  }
  return due ? done / due : 0
}

/** How a single day went across every habit. */
export function daySummary(habits, log, date) {
  const k = key(date)
  const due = habits.filter((h) => (isDue(h, date) && k >= h.created) || countOf(log, k, h.id) > 0)
  const done = due.filter((h) => countOf(log, k, h.id) >= h.goal).length
  return { due: due.length, done, frac: due.length ? done / due.length : 0, perfect: due.length > 0 && done === due.length }
}

export function perfectDays(habits, log) {
  let n = 0
  for (const k in log) if (daySummary(habits, log, fromKey(k)).perfect) n++
  return n
}
