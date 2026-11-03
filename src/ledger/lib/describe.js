import { firstName } from './flair'

export function describe(t, me, memberMap) {
  const n = (id) => (id === me ? 'You' : firstName(memberMap[id]?.name || 'Someone'))
  const other = Object.keys(t.splits)[0]
  if (t.type === 'payment') return `${n(t.paidBy)} paid ${other === me ? 'you' : n(other)}`
  if (t.splitMode === 'iou') return `${n(t.paidBy)} lent ${other === me ? 'you' : n(other)}`
  const count = Object.keys(t.splits).length
  return `${n(t.paidBy)} paid · ${count === 1 ? `for ${other === me ? 'you' : n(other)}` : `split ${count} ways`}`
}
