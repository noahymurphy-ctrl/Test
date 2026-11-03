import { useEffect, useReducer } from 'react'

export const STORAGE_KEY = 'glow.v1'

const initial = {
  habits: [],
  log: {}, // { 'YYYY-MM-DD': { habitId: count } }
  settings: { sound: true, haptics: true, theme: 'system' },
  hinted: false,
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (s && Array.isArray(s.habits)) return { ...initial, ...s, settings: { ...initial.settings, ...s.settings } }
  } catch {
    /* fall through */
  }
  return initial
}

function reducer(s, a) {
  switch (a.type) {
    case 'add':
      return { ...s, habits: [...s.habits, a.habit] }
    case 'update':
      return { ...s, habits: s.habits.map((h) => (h.id === a.habit.id ? { ...h, ...a.habit } : h)) }
    case 'remove': {
      const log = {}
      for (const [d, v] of Object.entries(s.log)) {
        const rest = { ...v }
        delete rest[a.id]
        if (Object.keys(rest).length) log[d] = rest
      }
      return { ...s, habits: s.habits.filter((h) => h.id !== a.id), log }
    }
    case 'move': {
      const i = s.habits.findIndex((h) => h.id === a.id)
      const j = i + a.by
      if (i < 0 || j < 0 || j >= s.habits.length) return s
      const habits = [...s.habits]
      ;[habits[i], habits[j]] = [habits[j], habits[i]]
      return { ...s, habits }
    }
    case 'set': {
      const day = { ...(s.log[a.day] || {}) }
      if (a.count > 0) day[a.id] = a.count
      else delete day[a.id]
      const log = { ...s.log }
      if (Object.keys(day).length) log[a.day] = day
      else delete log[a.day]
      return { ...s, log }
    }
    case 'settings':
      return { ...s, settings: { ...s.settings, ...a.patch } }
    case 'hinted':
      return { ...s, hinted: true }
    case 'replace':
      return { ...initial, ...a.state, settings: { ...initial.settings, ...a.state.settings } }
    case 'reset':
      return { ...initial, settings: s.settings }
    default:
      return s
  }
}

export function useStore() {
  const [s, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      /* storage full or blocked */
    }
  }, [s])
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {})
  }, [])
  return [s, dispatch]
}
