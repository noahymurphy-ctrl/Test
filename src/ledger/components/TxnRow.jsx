import { effectFor } from '../lib/balances'
import { describe } from '../lib/describe'
import { useStore } from '../lib/store'
import { Money } from './ui'

export function TxnRow({ t, onClick }) {
  const { me, memberMap, meta } = useStore()
  const cur = meta.currency
  const e = me ? effectFor(t, me) : 0
  const involved = me && (t.paidBy === me || me in t.splits)
  let label
  let tone = 'text-ink-3'
  let cents = t.amount
  if (t.type === 'payment') {
    if (t.paidBy === me) [label, tone] = ['you paid', 'text-ink']
    else if (me in t.splits) [label, tone] = ['you got', 'text-ink']
    else label = 'payment'
  } else if (!involved) label = 'not involved'
  else if (e > 0) [label, tone, cents] = ['you lent', 'text-pos', e]
  else if (e < 0) [label, tone, cents] = ['you owe', 'text-neg', -e]
  else [label, tone, cents] = ['just you', 'text-ink-2', t.amount]

  return (
    <button onClick={onClick} className="row-press flex w-full items-center gap-3.5 px-4 py-3 text-left">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-[15px] text-[24px] ${t.type === 'payment' ? 'bg-pos-soft' : 'bg-card-2'}`}>
        {t.emoji || '🧾'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-semibold">{t.title}</div>
        <div className="truncate text-[13.5px] text-ink-2">
          {describe(t, me, memberMap)} · <Money cents={t.amount} currency={cur} fracClass="" symClass="" />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">{label}</span>
        <Money cents={cents} currency={cur} className={`text-[17px] font-bold ${tone}`} />
      </div>
    </button>
  )
}
