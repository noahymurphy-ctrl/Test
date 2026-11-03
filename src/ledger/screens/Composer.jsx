import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Check, ChevronLeft, Delete, Divide, HandCoins, Handshake, Receipt, StickyNote, UsersRound } from 'lucide-react'
import { Avatar, Chip, Empty, Money, Segmented, Sheet } from '../components/ui'
import { put, todayISO, uid, useStore, getState } from '../lib/store'
import { fmt, fractionDigits, parseAmount, splitEven, toAmountString, currencySymbol } from '../lib/money'
import { EMOJI_CHOICES, firstName, guessEmoji } from '../lib/flair'
import { dayLabel } from '../lib/dates'
import { debts } from '../lib/balances'
import { celebrate, haptic, toast } from '../lib/fx'

const MODES = [
  { value: 'split', label: 'Split', icon: <Receipt size={15} strokeWidth={2.4} /> },
  { value: 'iou', label: 'IOU', icon: <HandCoins size={15} strokeWidth={2.4} /> },
  { value: 'settle', label: 'Paid back', icon: <Handshake size={15} strokeWidth={2.4} /> },
]

const PROMPTS = {
  split: 'What was the total?',
  iou: 'How much was lent?',
  settle: 'How much was paid back?',
}

export default function Composer({ state, onClose, onAddPeople }) {
  const editing = state?.preset?.txn
  return (
    <Sheet open={!!state?.open} onClose={onClose} label="New entry" title={editing ? 'Edit entry' : 'New entry'}>
      {state && <ComposerBody key={state.key} preset={state.preset || {}} onDone={onClose} onAddPeople={onAddPeople} />}
    </Sheet>
  )
}

function ComposerBody({ preset, onDone, onAddPeople }) {
  const { members, me, meta, memberMap } = useStore()
  const cur = meta.currency
  const editing = preset.txn
  const firstOther = members.find((m) => m.id !== me)?.id

  const initialMode = editing ? (editing.type === 'payment' ? 'settle' : editing.splitMode === 'iou' ? 'iou' : 'split') : preset.mode || 'split'
  const [mode, setMode] = useState(initialMode)
  const [step, setStep] = useState(preset.step || (editing ? 2 : 1))
  const [amountStr, setAmountStr] = useState(toAmountString(editing?.amount ?? preset.amount ?? 0))
  const amount = parseAmount(amountStr)

  const isSplit = editing && editing.type === 'expense' && editing.splitMode !== 'iou'
  const [title, setTitle] = useState(editing && editing.type !== 'payment' ? editing.title || '' : '')
  const [emoji, setEmoji] = useState(editing?.emoji || null)
  const [pickedEmoji, setPickedEmoji] = useState(!!editing)
  const [showEmoji, setShowEmoji] = useState(false)
  const [paidBy, setPaidBy] = useState(editing?.paidBy || me || members[0]?.id)
  const [people, setPeople] = useState(() => (isSplit ? Object.keys(editing.splits) : members.map((m) => m.id)))
  const [splitMode, setSplitMode] = useState(editing?.splitMode === 'exact' ? 'exact' : 'equal')
  const [exact, setExact] = useState(() =>
    editing?.splitMode === 'exact' ? Object.fromEntries(Object.entries(editing.splits).map(([k, v]) => [k, toAmountString(v)])) : {},
  )
  const pairFromTxn = editing && !isSplit ? [editing.paidBy, Object.keys(editing.splits)[0]] : null
  const [a, setA] = useState(pairFromTxn?.[0] || preset.from || me || members[0]?.id)
  const [b, setB] = useState(pairFromTxn?.[1] || preset.to || (preset.from && preset.from !== me ? me : firstOther))
  const [date, setDate] = useState(editing?.date || todayISO())
  const [note, setNote] = useState(editing?.note || '')
  const [showNote, setShowNote] = useState(!!editing?.note)
  const [shake, setShake] = useState(0)

  // Everyone who can appear in chips (includes archived people already on this entry).
  const roster = useMemo(() => {
    const ids = new Set(members.map((m) => m.id))
    const extra = editing ? [editing.paidBy, ...Object.keys(editing.splits)].filter((id) => !ids.has(id) && memberMap[id]) : []
    return [...members, ...extra.map((id) => memberMap[id])]
  }, [members, memberMap, editing])
  const order = (ids) => roster.map((m) => m.id).filter((id) => ids.includes(id))

  const name = (id) => (id === me ? 'You' : firstName(memberMap[id]?.name || 'Someone'))
  const verb = (id, you, them) => (id === me ? you : them)

  const autoEmoji = mode === 'settle' ? '🤝' : pickedEmoji && emoji ? emoji : guessEmoji(title) || (mode === 'iou' ? '💸' : '🧾')

  const orderedPeople = order(people)
  const equalShares = splitEven(amount, orderedPeople)
  const exactSum = orderedPeople.reduce((s, id) => s + parseAmount(exact[id]), 0)
  const remaining = amount - exactSum

  let problem = null
  if (!amount) problem = 'Enter an amount'
  else if (mode === 'split' && !people.length) problem = 'Pick who’s splitting'
  else if (mode === 'split' && splitMode === 'exact' && remaining !== 0)
    problem = remaining > 0 ? `${fmt(remaining, cur)} left to assign` : `${fmt(-remaining, cur)} over the total`
  else if (mode !== 'split' && (!a || !b)) problem = 'Pick two people'
  else if (mode !== 'split' && a === b) problem = 'Pick two different people'

  let summary = ''
  if (!problem) {
    if (mode === 'split') {
      const n = orderedPeople.length
      summary =
        splitMode === 'equal'
          ? `${name(paidBy)} paid ${fmt(amount, cur)} · ${n === 1 ? `all for ${name(orderedPeople[0]) === 'You' ? 'you' : name(orderedPeople[0])}` : `${amount % n ? '~' : ''}${fmt(Math.round(amount / n), cur)} each`}`
          : `${name(paidBy)} paid ${fmt(amount, cur)} · custom split`
    } else if (mode === 'iou') summary = `${name(b)} ${verb(b, 'owe', 'owes')} ${a === me ? 'you' : name(a)} ${fmt(amount, cur)}`
    else summary = `${name(a)} paid ${b === me ? 'you' : name(b)} ${fmt(amount, cur)}`
  }

  const switchMode = (m) => {
    setMode(m)
    if (m !== 'split' && a === b) setB(members.find((x) => x.id !== a)?.id)
  }

  const save = () => {
    if (problem) {
      setShake((s) => s + 1)
      haptic([20, 30, 20])
      return
    }
    let rec
    if (mode === 'split') {
      const splits =
        splitMode === 'equal'
          ? equalShares
          : Object.fromEntries(orderedPeople.map((id) => [id, parseAmount(exact[id])]).filter(([, v]) => v > 0))
      rec = { type: 'expense', splitMode, title: title.trim() || 'Expense', emoji: autoEmoji, paidBy, splits }
    } else if (mode === 'iou') {
      rec = { type: 'expense', splitMode: 'iou', title: title.trim() || 'Loan', emoji: autoEmoji, paidBy: a, splits: { [b]: amount } }
    } else {
      rec = { type: 'payment', splitMode: 'payment', title: 'Paid back', emoji: '🤝', paidBy: a, splits: { [b]: amount } }
    }
    put({
      ...(editing ? { id: editing.id } : { id: uid(), createdBy: me }),
      kind: 'txn',
      ...rec,
      amount,
      date,
      note: note.trim(),
    })
    onDone()

    if (mode === 'settle') {
      const s = getState()
      const left = debts(s.txns, s.meta.simplify)
      const pairOpen = left.some((d) => (d.from === a && d.to === b) || (d.from === b && d.to === a))
      if (!left.length) {
        setTimeout(() => celebrate({ count: 220 }), 250)
        toast('Everyone’s all square!', { icon: '🎉' })
      } else if (!pairOpen) {
        setTimeout(() => celebrate(), 250)
        toast(`${name(a)} and ${b === me ? 'you' : name(b)} are all square`, { icon: '🤝' })
      } else toast(editing ? 'Payment updated' : 'Payment recorded', { icon: '🤝' })
    } else toast(editing ? 'Saved changes' : `Added ${rec.title}`, { icon: rec.emoji })
  }

  if (members.length < 2) {
    return (
      <Empty emoji="👨‍👩‍👧‍👦" title="Add your family first" body="You need at least two people before you can split anything.">
        <button className="btn btn-primary" onClick={() => (onDone(), onAddPeople?.())}>
          <UsersRound size={19} /> Add people
        </button>
      </Empty>
    )
  }

  if (step === 1) {
    return (
      <div className="flex flex-col">
        <Segmented value={mode} onChange={switchMode} options={MODES} />
        <AmountEntry
          value={amountStr}
          onChange={setAmountStr}
          currency={cur}
          prompt={PROMPTS[mode]}
          onEnter={() => amount && setStep(2)}
        />
        <button className="btn btn-primary mt-3 w-full" disabled={!amount} onClick={() => setStep(2)}>
          Next <ArrowRight size={19} strokeWidth={2.5} />
        </button>
      </div>
    )
  }

  const chips = (selected, onPick, opts = {}) => (
    <div className={`-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar ${opts.wrap ? 'flex-wrap' : ''}`}>
      {roster.map((m) => (
        <Chip key={m.id} selected={selected(m.id)} onClick={() => onPick(m.id)}>
          <Avatar member={m} size={30} />
          {m.id === me ? 'You' : firstName(m.name)}
        </Chip>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-5 pt-1">
      <Segmented value={mode} onChange={switchMode} options={MODES} />

      <button onClick={() => setStep(1)} className="press -mt-1 flex flex-col items-center rounded-3xl py-2" aria-label="Change amount">
        <span className="text-[13px] font-semibold tracking-wide text-ink-3 uppercase">{PROMPTS[mode].replace('?', '')}</span>
        <Money cents={amount} currency={cur} className="text-[44px] leading-tight font-bold" />
        <span className="text-[13px] font-semibold text-accent">Tap to change</span>
      </button>

      {mode !== 'settle' && (
        <div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowEmoji((s) => !s)}
              className="press grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[16px] bg-card text-[28px] shadow-card"
              aria-label="Choose an emoji"
            >
              {autoEmoji}
            </button>
            <input
              className="field h-[52px] !bg-card shadow-card"
              placeholder={mode === 'iou' ? 'What for? (optional)' : 'What was it for?'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              enterKeyHint="done"
              maxLength={60}
            />
          </div>
          {showEmoji && (
            <div className="rise mt-2.5 grid grid-cols-7 gap-1 rounded-[18px] bg-card p-2 shadow-card">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  className={`press grid aspect-square place-items-center rounded-xl text-[24px] ${autoEmoji === e ? 'bg-accent-soft' : ''}`}
                  onClick={() => {
                    setEmoji(e)
                    setPickedEmoji(true)
                    setShowEmoji(false)
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'split' && (
        <>
          <Field label="Paid by">{chips((id) => id === paidBy, setPaidBy)}</Field>
          <Field
            label="Split between"
            action={
              <button
                className="text-[14px] font-semibold text-accent"
                onClick={() => setPeople(people.length === roster.length ? [] : roster.map((m) => m.id))}
              >
                {people.length === roster.length ? 'Clear' : 'Everyone'}
              </button>
            }
          >
            {chips(
              (id) => people.includes(id),
              (id) => setPeople((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
              { wrap: true },
            )}
          </Field>
          {orderedPeople.length > 0 && (
            <div>
              <Segmented
                value={splitMode}
                onChange={(v) => {
                  if (v === 'exact' && !Object.keys(exact).length)
                    setExact(Object.fromEntries(Object.entries(equalShares).map(([k, c]) => [k, toAmountString(c)])))
                  setSplitMode(v)
                }}
                options={[
                  { value: 'equal', label: 'Equally', icon: <Divide size={15} strokeWidth={2.5} /> },
                  { value: 'exact', label: 'Custom amounts' },
                ]}
              />
              <div className="mt-2.5 overflow-hidden rounded-[18px] bg-card shadow-card">
                {orderedPeople.map((id, i) => (
                  <div key={id} className={`flex items-center gap-3 px-3.5 py-2.5 ${i ? 'border-t border-line' : ''}`}>
                    <Avatar member={memberMap[id]} size={32} />
                    <span className="flex-1 truncate text-[16px] font-medium">{id === me ? 'You' : memberMap[id]?.name}</span>
                    {splitMode === 'equal' ? (
                      <Money cents={equalShares[id] || 0} currency={cur} className="text-[17px] font-semibold" />
                    ) : (
                      <label className="flex items-center gap-1 rounded-xl bg-card-2 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-accent">
                        <span className="num text-ink-3">{currencySymbol(cur)}</span>
                        <input
                          inputMode="decimal"
                          className="num w-[84px] bg-transparent text-right text-[17px] font-semibold outline-none"
                          value={exact[id] || ''}
                          placeholder="0"
                          onChange={(e) => setExact((x) => ({ ...x, [id]: e.target.value.replace(/[^\d.]/g, '') }))}
                        />
                      </label>
                    )}
                  </div>
                ))}
                {splitMode === 'exact' && (
                  <div className={`border-t border-line px-3.5 py-2.5 text-right text-[14px] font-semibold ${remaining === 0 ? 'text-pos' : 'text-neg'}`}>
                    {remaining === 0 ? '✓ Adds up perfectly' : remaining > 0 ? `${fmt(remaining, cur)} left` : `${fmt(-remaining, cur)} too much`}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {mode !== 'split' && (
        <>
          <PairVisual a={roster.find((m) => m.id === a)} b={roster.find((m) => m.id === b)} mode={mode} />
          <Field label={mode === 'iou' ? 'Who lent the money?' : 'Who paid?'}>{chips((id) => id === a, setA)}</Field>
          <Field label={mode === 'iou' ? 'Who owes it?' : 'Who got paid?'}>{chips((id) => id === b, setB)}</Field>
        </>
      )}

      <div className="overflow-hidden rounded-[18px] bg-card shadow-card">
        <label className="relative flex items-center gap-3 px-4 py-3.5">
          <CalendarDays size={20} className="text-accent" />
          <span className="flex-1 text-[16px]">Date</span>
          <span className="text-[16px] font-semibold text-ink-2">{dayLabel(date)}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Date"
          />
        </label>
        <div className="border-t border-line">
          {showNote ? (
            <textarea
              autoFocus={!note}
              className="block w-full resize-none bg-transparent px-4 py-3.5 text-[16px] outline-none placeholder:text-ink-3"
              rows={2}
              placeholder="Add a note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
            />
          ) : (
            <button onClick={() => setShowNote(true)} className="row-press flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <StickyNote size={20} className="text-accent" />
              <span className="text-[16px] text-ink-2">Add a note</span>
            </button>
          )}
        </div>
      </div>

      <div className="sticky -bottom-5 z-20 -mx-5 -mb-5 bg-bg px-5 pt-3 pb-5 before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-bg before:to-transparent">
        <div key={shake} className={`mb-2.5 min-h-[20px] text-center text-[14px] font-semibold ${problem ? (shake ? 'shake text-neg' : 'text-ink-3') : 'text-ink-2'}`}>
          {problem || summary}
        </div>
        <div className="flex gap-2.5">
          <button className="btn btn-ghost w-[52px] !px-0" onClick={() => setStep(1)} aria-label="Back">
            <ChevronLeft size={22} />
          </button>
          <button className="btn btn-primary flex-1" onClick={save}>
            <Check size={20} strokeWidth={2.8} /> {editing ? 'Save changes' : mode === 'settle' ? 'Record payment' : 'Add it'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, action, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[13px] font-semibold tracking-wide text-ink-2 uppercase">{label}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function PairVisual({ a, b, mode }) {
  return (
    <div className="flex items-center justify-center gap-4 py-1">
      <div className="flex w-20 flex-col items-center gap-1.5">
        <Avatar member={a} size={56} className="pop" key={a?.id} />
        <span className="truncate text-[13px] font-semibold text-ink-2">{mode === 'iou' ? 'lender' : 'payer'}</span>
      </div>
      <div className="flex flex-1 items-center">
        <div className="h-[3px] flex-1 rounded-full bg-gradient-to-r from-accent/20 to-accent" />
        <ArrowRight className="-ml-2 text-accent" size={22} strokeWidth={3} />
      </div>
      <div className="flex w-20 flex-col items-center gap-1.5">
        <Avatar member={b} size={56} className="pop" key={b?.id} />
        <span className="truncate text-[13px] font-semibold text-ink-2">{mode === 'iou' ? 'borrower' : 'receiver'}</span>
      </div>
    </div>
  )
}

const DEC = (1.1).toLocaleString().charAt(1)

function AmountEntry({ value, onChange, currency, prompt, onEnter }) {
  const allowDecimal = fractionDigits(currency) > 0
  const [bump, setBump] = useState(0)

  const press = (k) => {
    const v = value
    let next
    if (k === 'del') next = v.slice(0, -1)
    else if (k === '.') {
      if (!allowDecimal || v.includes('.')) return setBump((b) => b + 1)
      next = (v || '0') + '.'
    } else {
      const [w, d] = v.split('.')
      if (d !== undefined && d.length >= 2) return setBump((b) => b + 1)
      if (d === undefined && w.length >= 7) return setBump((b) => b + 1)
      next = v === '0' ? k : v + k
    }
    haptic(5)
    onChange(next)
  }

  const onKey = useEffectEvent((e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input,textarea')) return
    if (/^\d$/.test(e.key)) press(e.key)
    else if (e.key === '.' || e.key === ',') press('.')
    else if (e.key === 'Backspace') press('del')
    else if (e.key === 'Enter') onEnter()
    else return
    e.preventDefault()
  })

  useEffect(() => {
    const h = (e) => onKey(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const [w = '', d] = value.split('.')
  const whole = w ? Number(w).toLocaleString() : '0'
  const sym = currencySymbol(currency)
  const len = whole.length + (d !== undefined ? d.length + 1 : 0)
  const size = len <= 5 ? 72 : len <= 8 ? 58 : 46

  return (
    <div className="flex flex-col">
      <div className="pt-6 pb-1 text-center text-[15px] font-semibold text-ink-2">{prompt}</div>
      <div key={bump} className={`num flex h-[104px] items-center justify-center font-bold ${bump ? 'shake' : ''}`} style={{ fontSize: size }} aria-live="polite">
        <span className="mr-1 text-[0.5em] font-semibold text-ink-3">{sym}</span>
        <span className={value ? '' : 'text-ink-3'}>{whole}</span>
        {d !== undefined && (
          <span>
            {DEC}
            {d}
            <span className="text-ink-3/50">{'0'.repeat(2 - d.length)}</span>
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5" role="group" aria-label="Keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((k) => (
          <button
            key={k}
            className="keypad-key"
            onClick={() => press(k)}
            aria-label={k === 'del' ? 'Delete' : k === '.' ? 'Decimal point' : k}
            disabled={k === '.' && !allowDecimal}
          >
            {k === 'del' ? <Delete size={26} strokeWidth={2} /> : k === '.' ? (allowDecimal ? DEC : '') : k}
          </button>
        ))}
      </div>
    </div>
  )
}
