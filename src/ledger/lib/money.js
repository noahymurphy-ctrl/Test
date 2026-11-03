// All amounts are integers in hundredths of the currency unit ("cents").

const cache = new Map()
function nf(currency, opts = {}) {
  const key = currency + JSON.stringify(opts)
  let f = cache.get(key)
  if (!f) {
    try {
      f = new Intl.NumberFormat(undefined, { style: 'currency', currency, ...opts })
    } catch {
      f = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', ...opts })
    }
    cache.set(key, f)
  }
  return f
}

export function fractionDigits(currency) {
  return nf(currency).resolvedOptions().maximumFractionDigits
}

export function fmt(cents, currency = 'USD', { sign = false, abs = false } = {}) {
  const v = (abs ? Math.abs(cents) : cents) / 100
  return nf(currency, sign ? { signDisplay: 'exceptZero' } : {}).format(v)
}

/** Formatted parts so the UI can style the symbol / decimals separately. */
export function fmtParts(cents, currency = 'USD') {
  const parts = nf(currency).formatToParts(Math.abs(cents) / 100)
  let symbol = ''
  let whole = ''
  let frac = ''
  let symbolFirst = true
  let seenNumber = false
  for (const p of parts) {
    if (p.type === 'currency') {
      symbol = p.value
      symbolFirst = !seenNumber
    } else if (p.type === 'integer' || p.type === 'group') {
      whole += p.value
      seenNumber = true
    } else if (p.type === 'decimal' || p.type === 'fraction') frac += p.value
  }
  return { symbol, whole, frac, symbolFirst }
}

export function currencySymbol(currency) {
  return fmtParts(0, currency).symbol
}

export function parseAmount(str) {
  if (!str) return 0
  const [w, d = ''] = String(str).replace(/[^\d.]/g, '').split('.')
  return (parseInt(w || '0', 10) || 0) * 100 + (parseInt((d + '00').slice(0, 2), 10) || 0)
}

export function toAmountString(cents) {
  if (!cents) return ''
  const w = Math.floor(cents / 100)
  const d = cents % 100
  if (!d) return String(w)
  return `${w}.${String(d).padStart(2, '0')}`
}

/** Split `total` evenly between ids; leftover cents go to the first people. */
export function splitEven(total, ids) {
  const out = {}
  if (!ids.length) return out
  const base = Math.floor(total / ids.length)
  let rest = total - base * ids.length
  for (const id of ids) {
    out[id] = base + (rest > 0 ? 1 : 0)
    if (rest > 0) rest--
  }
  return out
}

export const CURRENCIES = [
  ['USD', 'US Dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'British Pound'],
  ['CAD', 'Canadian Dollar'],
  ['AUD', 'Australian Dollar'],
  ['NZD', 'New Zealand Dollar'],
  ['MXN', 'Mexican Peso'],
  ['JPY', 'Japanese Yen'],
  ['INR', 'Indian Rupee'],
  ['CHF', 'Swiss Franc'],
  ['SEK', 'Swedish Krona'],
  ['BRL', 'Brazilian Real'],
  ['ZAR', 'South African Rand'],
  ['SGD', 'Singapore Dollar'],
  ['PHP', 'Philippine Peso'],
]
