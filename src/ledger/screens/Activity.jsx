import { useMemo, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Avatar, Chip, Empty, Money } from '../components/ui'
import { TxnRow } from '../components/TxnRow'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { dayLabel } from '../lib/dates'
import { firstName } from '../lib/flair'

export default function Activity() {
  const { txns, members, memberMap, me, meta } = useStore()
  const nav = useNav()
  const [q, setQ] = useState('')
  const [who, setWho] = useState(null)
  const [kind, setKind] = useState('all')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return txns.filter((t) => {
      if (who && t.paidBy !== who && !(who in t.splits)) return false
      if (kind === 'expenses' && t.type === 'payment') return false
      if (kind === 'payments' && t.type !== 'payment') return false
      if (!needle) return true
      const names = [t.paidBy, ...Object.keys(t.splits)].map((id) => memberMap[id]?.name || '').join(' ')
      return `${t.title} ${t.note || ''} ${names} ${(t.amount / 100).toFixed(2)}`.toLowerCase().includes(needle)
    })
  }, [txns, q, who, kind, memberMap])

  const groups = useMemo(() => {
    const out = []
    for (const t of filtered) {
      const last = out[out.length - 1]
      if (last && last.date === t.date) last.items.push(t)
      else out.push({ date: t.date, items: [t] })
    }
    return out
  }, [filtered])

  const month = useMemo(() => {
    const now = new Date()
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    let total = 0
    let mine = 0
    let count = 0
    for (const t of txns) {
      if (!t.date?.startsWith(prefix) || t.type === 'payment' || t.splitMode === 'iou') continue
      total += t.amount
      mine += t.splits[me] || 0
      count++
    }
    return { total, mine, count, label: now.toLocaleDateString(undefined, { month: 'long' }) }
  }, [txns, me])

  return (
    <div>
      <header className="flex items-end justify-between pt-2 pb-4">
        <h1 className="title text-[34px] leading-tight font-extrabold">Activity</h1>
      </header>

      {txns.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="text-[13px] font-semibold text-ink-2">Family spent in {month.label}</div>
            <Money cents={month.total} currency={meta.currency} className="mt-1 block text-[24px] font-bold" />
            <div className="text-[13px] text-ink-3">
              {month.count} {month.count === 1 ? 'expense' : 'expenses'}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-[13px] font-semibold text-ink-2">Your share</div>
            <Money cents={month.mine} currency={meta.currency} className="mt-1 block text-[24px] font-bold text-accent" />
            <div className="text-[13px] text-ink-3">{month.total ? Math.round((month.mine / month.total) * 100) : 0}% of the total</div>
          </div>
        </div>
      )}

      <div className="sticky top-[calc(var(--sat)+8px)] z-20 -mx-1 mb-3 px-1">
        <label className="glass flex h-12 items-center gap-2 rounded-2xl border border-line px-3.5 shadow-card">
          <Search size={19} className="text-ink-3" />
          <input
            id="activity-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search entries, people, amounts"
            className="h-full flex-1 bg-transparent outline-none placeholder:text-ink-3"
            enterKeyHint="search"
            type="search"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search" className="grid h-6 w-6 place-items-center rounded-full bg-ink-3/30">
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </label>
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:px-0">
        {['all', 'expenses', 'payments'].map((k) => (
          <Chip key={k} selected={kind === k} onClick={() => setKind(k)} className="!px-4 capitalize">
            {k}
          </Chip>
        ))}
        <div className="mx-1 w-px shrink-0 bg-line" />
        {members.map((m) => (
          <Chip key={m.id} selected={who === m.id} onClick={() => setWho(who === m.id ? null : m.id)}>
            <Avatar member={m} size={26} />
            {m.id === me ? 'You' : firstName(m.name)}
          </Chip>
        ))}
      </div>

      {groups.length ? (
        groups.map((g) => (
          <section key={g.date} className="mb-4">
            <h3 className="mb-1.5 px-1 text-[13px] font-semibold tracking-wide text-ink-2 uppercase">{dayLabel(g.date)}</h3>
            <div className="card overflow-hidden">
              {g.items.map((t, i) => (
                <div key={t.id} className={i ? 'border-t border-line' : ''}>
                  <TxnRow t={t} onClick={() => nav.openTxn(t.id)} />
                </div>
              ))}
            </div>
          </section>
        ))
      ) : txns.length ? (
        <Empty emoji="🔍" title="Nothing matches" body="Try a different search or clear the filters." />
      ) : (
        <Empty emoji="🌱" title="A fresh start" body="Everything you add shows up here, newest first.">
          <button className="btn btn-primary" onClick={() => nav.openComposer()}>
            <Plus size={20} strokeWidth={2.8} /> Add an entry
          </button>
        </Empty>
      )}
    </div>
  )
}
