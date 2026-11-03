export const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const today = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
export const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function dayTitle(k, todayKey) {
  if (k === todayKey) return 'Today'
  if (k === key(addDays(fromKey(todayKey), -1))) return 'Yesterday'
  return WEEKDAYS_LONG[fromKey(k).getDay()]
}

export const longDate = (k) =>
  fromKey(k).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

export const monthName = (d) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
