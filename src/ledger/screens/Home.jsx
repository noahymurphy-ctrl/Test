import { useMemo } from 'react'
import { ArrowRight, Handshake, Plus, Sparkles } from 'lucide-react'
import { AnimatedMoney, Avatar, Empty, Money, SectionTitle } from '../components/ui'
import { TxnRow } from '../components/TxnRow'
import { useStore } from '../lib/store'
import { debts, netBalances } from '../lib/balances'
import { firstName, greeting } from '../lib/flair'
import { useNav } from '../lib/nav'
import { SyncDot } from '../components/SyncDot'

export default function Home() {
  const { members, memberMap, txns, me, meta } = useStore()
  const nav = useNav()
  const cur = meta.currency
  const all = useMemo(() => debts(txns, meta.simplify), [txns, meta.simplify])
  const net = useMemo(() => netBalances(txns), [txns])
  const mine = all.filter((d) => d.from === me || d.to === me)
  const others = all.filter((d) => d.from !== me && d.to !== me)
  const myNet = mine.reduce((s, d) => s + (d.to === me ? d.amount : -d.amount), 0)
  const owedToMe = mine.filter((d) => d.to === me).reduce((s, d) => s + d.amount, 0)
  const iOwe = mine.filter((d) => d.from === me).reduce((s, d) => s + d.amount, 0)
  const meM = memberMap[me]

  const tone = myNet > 0 ? 'owed' : myNet < 0 ? 'owe' : 'even'
  const heroLabel = tone === 'owed' ? 'You’re owed' : tone === 'owe' ? 'You owe' : 'You’re all square'
  const heroSub =
    tone === 'even'
      ? all.length
        ? 'Nothing between you and anyone ✨'
        : txns.length
          ? 'The whole family is settled up 🎉'
          : 'Add your first expense to get rolling'
      : owedToMe && iOwe
        ? `Owed ${fmtShort(owedToMe, cur)} · owe ${fmtShort(iOwe, cur)}`
        : `${tone === 'owed' ? 'From' : 'To'} ${mine.length} ${mine.length === 1 ? 'person' : 'people'}`

  const maxAbs = Math.max(1, ...members.map((m) => Math.abs(net[m.id] || 0)))

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
      <div>
        <header className="flex items-center gap-3 pt-2 pb-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[15px] font-medium text-ink-2">
              {greeting()} <SyncDot />
            </div>
            <h1 className="title truncate text-[34px] leading-tight font-extrabold">{meM ? firstName(meM.name) : meta.name}</h1>
          </div>
          <button onClick={nav.openIdentity} className="press rounded-full" aria-label="Switch who you are">
            <Avatar member={meM} size={48} />
          </button>
        </header>

        <section className={`hero hero-${tone} rise p-6 pb-5`}>
          <div className="text-[15px] font-semibold opacity-90">{heroLabel}</div>
          <div className="mt-1 mb-1 flex min-h-[60px] items-center">
            {tone === 'even' ? (
              <div className="pop flex items-center gap-2 text-[46px] leading-none">
                <Sparkles size={40} strokeWidth={2.2} /> <span className="title font-extrabold">Even</span>
              </div>
            ) : (
              <AnimatedMoney cents={Math.abs(myNet)} currency={cur} className="text-[54px] leading-none font-extrabold" fracClass="text-[0.55em] opacity-80" symClass="mr-0.5 text-[0.6em] opacity-80" />
            )}
          </div>
          <div className="text-[15px] font-medium opacity-90">{heroSub}</div>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button onClick={() => nav.openComposer()} className="press flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/25 text-[16px] font-bold backdrop-blur-md">
              <Plus size={20} strokeWidth={2.8} /> Add
            </button>
            <button
              onClick={() => nav.openComposer(mine[0] ? { mode: 'settle', from: mine[0].from, to: mine[0].to, amount: mine[0].amount, step: 2 } : { mode: 'settle' })}
              className="press flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[16px] font-bold text-[#1d1638]"
            >
              <Handshake size={20} strokeWidth={2.4} /> Settle up
            </button>
          </div>
        </section>

        {members.length < 2 && (
          <div className="card rise mt-5 flex items-center gap-4 p-4">
            <div className="text-[34px]">👨‍👩‍👧‍👦</div>
            <div className="flex-1">
              <div className="font-bold">Add your family</div>
              <div className="text-[14px] text-ink-2">Who do you share costs with?</div>
            </div>
            <button className="btn btn-soft h-10 px-4 text-[15px]" onClick={() => nav.go('people')}>
              Add
            </button>
          </div>
        )}

        {mine.length > 0 && (
          <>
            <SectionTitle>Your balances</SectionTitle>
            <div className="card overflow-hidden">
              {mine.map((d, i) => {
                const otherId = d.from === me ? d.to : d.from
                const o = memberMap[otherId]
                const owesMe = d.to === me
                return (
                  <div key={otherId} className={`flex items-center gap-3 py-3 pr-3 pl-4 ${i ? 'border-t border-line' : ''}`}>
                    <button className="press flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => nav.openPerson(otherId)}>
                      <Avatar member={o} size={44} />
                      <div className="min-w-0">
                        <div className="truncate text-[16px] font-semibold">{owesMe ? `${firstName(o?.name)} owes you` : `You owe ${firstName(o?.name)}`}</div>
                        <Money cents={d.amount} currency={cur} className={`text-[19px] font-bold ${owesMe ? 'text-pos' : 'text-neg'}`} />
                      </div>
                    </button>
                    <button
                      className={`press h-9 rounded-full px-4 text-[14px] font-bold ${owesMe ? 'bg-pos-soft text-pos' : 'bg-neg-soft text-neg'}`}
                      onClick={() => nav.openComposer({ mode: 'settle', from: d.from, to: d.to, amount: d.amount, step: 2 })}
                    >
                      Settle
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {members.length > 1 && txns.length > 0 && (
          <>
            <SectionTitle>Family board</SectionTitle>
            <div className="card p-4">
              <div className="flex flex-col gap-3.5">
                {[...members]
                  .sort((x, y) => (net[y.id] || 0) - (net[x.id] || 0))
                  .map((m) => {
                    const v = net[m.id] || 0
                    const pct = (Math.abs(v) / maxAbs) * 50
                    return (
                      <button key={m.id} className="press flex items-center gap-3 text-left" onClick={() => nav.openPerson(m.id)}>
                        <Avatar member={m} size={34} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-[15px] font-semibold">{m.id === me ? 'You' : firstName(m.name)}</span>
                            <Money
                              cents={Math.abs(v)}
                              currency={cur}
                              className={`text-[14px] font-bold ${v > 0 ? 'text-pos' : v < 0 ? 'text-neg' : 'text-ink-3'}`}
                            />
                          </div>
                          <div className="relative mt-1.5 h-2 rounded-full bg-bg-2">
                            <div className="absolute top-[-3px] bottom-[-3px] left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-line" />
                            <div
                              className={`absolute top-0 bottom-0 rounded-full transition-all duration-700 ease-ios ${v >= 0 ? 'left-1/2 bg-pos' : 'right-1/2 bg-neg'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    )
                  })}
              </div>
              {others.length > 0 && (
                <div className="mt-4 border-t border-line pt-3.5">
                  <div className="mb-2 text-[13px] font-semibold tracking-wide text-ink-2 uppercase">To settle everyone else</div>
                  {others.map((d) => (
                    <button
                      key={d.from + d.to}
                      onClick={() => nav.openComposer({ mode: 'settle', from: d.from, to: d.to, amount: d.amount, step: 2 })}
                      className="row-press -mx-2 flex w-[calc(100%+16px)] items-center gap-2 rounded-xl px-2 py-1.5"
                    >
                      <Avatar member={memberMap[d.from]} size={26} />
                      <span className="text-[15px] font-medium">{firstName(memberMap[d.from]?.name)}</span>
                      <ArrowRight size={15} className="text-ink-3" />
                      <Avatar member={memberMap[d.to]} size={26} />
                      <span className="flex-1 truncate text-left text-[15px] font-medium">{firstName(memberMap[d.to]?.name)}</span>
                      <Money cents={d.amount} currency={cur} className="text-[15px] font-bold" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div>
        <SectionTitle
          action={
            txns.length > 0 && (
              <button className="text-[15px] font-semibold text-accent" onClick={() => nav.go('activity')}>
                See all
              </button>
            )
          }
        >
          Recent
        </SectionTitle>
        {txns.length ? (
          <div className="card overflow-hidden">
            {txns.slice(0, 8).map((t, i) => (
              <div key={t.id} className={i ? 'border-t border-line' : ''}>
                <TxnRow t={t} onClick={() => nav.openTxn(t.id)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <Empty emoji="🧾" title="No entries yet" body="Dinner, groceries, a loan for concert tickets — add it and Evenly does the math.">
              <button className="btn btn-primary" onClick={() => nav.openComposer()}>
                <Plus size={20} strokeWidth={2.8} /> Add first entry
              </button>
            </Empty>
          </div>
        )}
      </div>
    </div>
  )
}

function fmtShort(cents, cur) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100)
}
