import { useMemo, useState } from 'react'
import { BellRing, ChevronRight, Handshake, Pencil, Plus, Trash2, UserRoundPlus } from 'lucide-react'
import { Avatar, Empty, Money, Sheet } from '../components/ui'
import { TxnRow } from '../components/TxnRow'
import { put, remove, restore, uid, useStore, setLocal } from '../lib/store'
import { debts, netBalances } from '../lib/balances'
import { AVATARS, TINTS, firstName, pick } from '../lib/flair'
import { fmt } from '../lib/money'
import { useNav } from '../lib/nav'
import { celebrate, toast } from '../lib/fx'

export default function People() {
  const { members, txns, me, meta } = useStore()
  const nav = useNav()
  const net = useMemo(() => netBalances(txns), [txns])

  return (
    <div>
      <header className="pt-2 pb-4">
        <div className="text-[15px] font-medium text-ink-2">{meta.name}</div>
        <h1 className="title text-[34px] leading-tight font-extrabold">Family</h1>
      </header>

      <div className="card overflow-hidden">
        {members.map((m, i) => {
          const v = net[m.id] || 0
          return (
            <button key={m.id} onClick={() => nav.openPerson(m.id)} className={`row-press flex w-full items-center gap-3.5 px-4 py-3 text-left ${i ? 'border-t border-line' : ''}`}>
              <Avatar member={m} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[17px] font-semibold">{m.name}</span>
                  {m.id === me && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent uppercase">You</span>}
                </div>
                <div className={`text-[14px] font-medium ${v > 0 ? 'text-pos' : v < 0 ? 'text-neg' : 'text-ink-3'}`}>
                  {v > 0 ? (
                    <>
                      gets back <Money cents={v} currency={meta.currency} fracClass="" symClass="" />
                    </>
                  ) : v < 0 ? (
                    <>
                      owes <Money cents={-v} currency={meta.currency} fracClass="" symClass="" />
                    </>
                  ) : (
                    'all square'
                  )}
                </div>
              </div>
              <ChevronRight size={20} className="text-ink-3" />
            </button>
          )
        })}
        <button onClick={nav.openAddPerson} className={`row-press flex w-full items-center gap-3.5 px-4 py-3 text-left ${members.length ? 'border-t border-line' : ''}`}>
          <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-accent/50 text-accent">
            <Plus size={22} strokeWidth={2.6} />
          </div>
          <span className="text-[17px] font-semibold text-accent">Add someone</span>
        </button>
      </div>
      <p className="mt-3 px-2 text-[13.5px] leading-snug text-ink-3">
        Anyone can be added — kids, grandparents, the dog walker. They don’t need the app; whoever has it can log things for them.
      </p>
    </div>
  )
}

export function MemberEditor({ initial = {}, onSave, submitLabel = 'Save', autoFocus = true }) {
  const [name, setName] = useState(initial.name || '')
  const [emoji, setEmoji] = useState(initial.emoji || pick(AVATARS))
  const [color, setColor] = useState(initial.color || pick(TINTS))
  const submit = (e) => {
    e?.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), emoji, color })
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex justify-center pt-1">
        <Avatar member={{ emoji, color }} size={92} className="pop" key={emoji + color} />
      </div>
      <input className="field text-center text-[18px] font-semibold" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus={autoFocus} maxLength={30} enterKeyHint="done" />
      <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 py-1 no-scrollbar">
        {AVATARS.map((a) => (
          <button
            type="button"
            key={a}
            onClick={() => setEmoji(a)}
            className={`press grid h-11 w-11 shrink-0 place-items-center rounded-full text-[24px] ${emoji === a ? 'bg-accent-soft ring-2 ring-accent' : 'bg-card-2'}`}
            aria-label={`Avatar ${a}`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-2.5">
        {TINTS.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setColor(c)}
            className={`press h-8 w-8 rounded-full transition-shadow ${color === c ? 'ring-[3px] ring-accent ring-offset-2 ring-offset-bg' : ''}`}
            style={{ background: c }}
            aria-label="Color"
          />
        ))}
      </div>
      <button className="btn btn-primary mt-1 w-full" disabled={!name.trim()}>
        {submitLabel}
      </button>
    </form>
  )
}

export function AddPersonSheet({ open, onClose }) {
  const [k, setK] = useState(0)
  return (
    <Sheet open={open} onClose={onClose} title="Add someone" label="Add someone">
      <MemberEditor
        key={k}
        submitLabel="Add to family"
        onSave={(m) => {
          put({ id: uid(), kind: 'member', ...m })
          toast(`${firstName(m.name)} joined the family`, { icon: m.emoji })
          setK((x) => x + 1)
          onClose()
        }}
      />
    </Sheet>
  )
}

export function PersonSheet({ id, onClose }) {
  const { memberMap } = useStore()
  const m = id && memberMap[id]
  return (
    <Sheet open={!!id} onClose={onClose} title={m ? m.name : ''} label="Person">
      {m && <PersonBody key={id} m={m} onClose={onClose} />}
    </Sheet>
  )
}

function PersonBody({ m, onClose }) {
  const { txns, me, meta, members } = useStore()
  const nav = useNav()
  const [editing, setEditing] = useState(false)
  const [limit, setLimit] = useState(20)
  const cur = meta.currency
  const isMe = m.id === me
  const all = useMemo(() => debts(txns, meta.simplify), [txns, meta.simplify])
  const net = useMemo(() => netBalances(txns), [txns])
  const pair = all.find((d) => (d.from === m.id && d.to === me) || (d.to === m.id && d.from === me))
  const theyOwe = pair?.from === m.id
  const v = net[m.id] || 0
  const history = txns.filter((t) => {
    const inT = (id) => t.paidBy === id || id in t.splits
    return inT(m.id) && (isMe || !me || inT(me))
  })

  if (editing) {
    return (
      <MemberEditor
        initial={m}
        autoFocus={false}
        onSave={(patch) => {
          put({ id: m.id, ...patch })
          setEditing(false)
          toast('Saved', { icon: patch.emoji })
        }}
      />
    )
  }

  const remind = async () => {
    const recent = history
      .filter((t) => t.type !== 'payment')
      .slice(0, 3)
      .map((t) => `${t.emoji} ${t.title}`)
      .join(', ')
    const text = `Hey ${firstName(m.name)}! Friendly Evenly nudge 💜 You owe me ${fmt(pair.amount, cur)}${recent ? ` (${recent})` : ''}. No rush!`
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        toast('Reminder copied — paste it in a text', { icon: '📋' })
      }
    } catch {
      /* share cancelled */
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 pt-1">
        <button onClick={() => setEditing(true)} className="press relative rounded-full" aria-label="Edit">
          <Avatar member={m} size={96} className="wiggle" />
          <span className="absolute right-0 bottom-0 grid h-8 w-8 place-items-center rounded-full bg-card text-accent shadow-card">
            <Pencil size={15} strokeWidth={2.5} />
          </span>
        </button>
        <div className={`text-[15px] font-semibold ${v > 0 ? 'text-pos' : v < 0 ? 'text-neg' : 'text-ink-3'}`}>
          {isMe ? 'You' : firstName(m.name)} {v > 0 ? `${isMe ? 'get' : 'gets'} back ${fmt(v, cur)} overall` : v < 0 ? `${isMe ? 'owe' : 'owes'} ${fmt(-v, cur)} overall` : `${isMe ? 'are' : 'is'} all square`}
        </div>
      </div>

      {!isMe && me && (
        <div className={`rounded-[22px] p-5 text-center ${pair ? (theyOwe ? 'bg-pos-soft' : 'bg-neg-soft') : 'bg-accent-soft'}`}>
          {pair ? (
            <>
              <div className="text-[15px] font-semibold text-ink-2">{theyOwe ? `${firstName(m.name)} owes you` : `You owe ${firstName(m.name)}`}</div>
              <Money cents={pair.amount} currency={cur} className={`text-[40px] font-extrabold ${theyOwe ? 'text-pos' : 'text-neg'}`} />
              <div className="mt-3 flex gap-2">
                <button className="btn btn-primary h-12 flex-1 text-[16px]" onClick={() => (onClose(), nav.openComposer({ mode: 'settle', from: pair.from, to: pair.to, amount: pair.amount, step: 2 }))}>
                  <Handshake size={19} /> Settle up
                </button>
                {theyOwe && (
                  <button className="btn btn-ghost h-12 text-[16px]" onClick={remind}>
                    <BellRing size={19} /> Nudge
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-2">
              <div className="text-[34px]">🤝</div>
              <div className="title mt-1 text-[18px] font-bold">You two are all square</div>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="mb-2 px-1 text-[13px] font-semibold tracking-wide text-ink-2 uppercase">{isMe || !me ? 'History' : 'Between you two'}</div>
        {history.length ? (
          <div className="card overflow-hidden">
            {history.slice(0, limit).map((t, i) => (
              <div key={t.id} className={i ? 'border-t border-line' : ''}>
                <TxnRow t={t} onClick={() => nav.openTxn(t.id)} />
              </div>
            ))}
            {history.length > limit && (
              <button className="row-press w-full border-t border-line py-3 text-[15px] font-semibold text-accent" onClick={() => setLimit((l) => l + 30)}>
                Show more
              </button>
            )}
          </div>
        ) : (
          <div className="card py-6 text-center text-[15px] text-ink-3">Nothing here yet</div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {!isMe && (
          <button className="btn btn-ghost w-full text-[16px]" onClick={() => setLocal({ me: m.id })}>
            <UserRoundPlus size={19} /> This is me on this device
          </button>
        )}
        <button
          className="btn w-full text-[16px] text-neg"
          disabled={v !== 0 || members.length <= 1}
          onClick={() => {
            if (!confirm(`Remove ${m.name} from the family? Their past entries stay in the history.`)) return
            remove(m.id)
            onClose()
            toast(`${firstName(m.name)} removed`, { icon: '👋', action: 'Undo', onAction: () => restore(m.id) })
          }}
        >
          <Trash2 size={18} /> Remove from family
        </button>
        {v !== 0 && <p className="-mt-1 text-center text-[13px] text-ink-3">Settle {isMe ? 'your' : 'their'} balance before removing.</p>}
      </div>
    </div>
  )
}

export function IdentitySheet({ open, onClose, forced }) {
  const { members, me, meta } = useStore()
  const [adding, setAdding] = useState(false)
  return (
    <Sheet open={open} onClose={forced ? () => {} : onClose} title="Who are you?" label="Who are you">
      {adding ? (
        <MemberEditor
          submitLabel="That’s me"
          onSave={(m) => {
            const id = uid()
            put({ id, kind: 'member', ...m })
            setLocal({ me: id })
            setAdding(false)
            onClose()
            celebrate()
            toast(`Welcome to ${meta.name}!`, { icon: m.emoji })
          }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="px-1 text-[15px] text-ink-2">This only changes things on this device, so balances read from your point of view.</p>
          {members.length ? (
            <div className="grid grid-cols-3 gap-2.5">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setLocal({ me: m.id })
                    onClose()
                    toast(`Hi, ${firstName(m.name)}!`, { icon: m.emoji })
                  }}
                  className={`press flex flex-col items-center gap-2 rounded-[20px] p-3 ${m.id === me ? 'bg-accent-soft ring-2 ring-accent' : 'bg-card shadow-card'}`}
                >
                  <Avatar member={m} size={56} />
                  <span className="w-full truncate text-center text-[15px] font-semibold">{firstName(m.name)}</span>
                </button>
              ))}
            </div>
          ) : (
            <Empty emoji="⏳" title="Loading your family…" body="Hang tight while we fetch everyone." />
          )}
          <button className="btn btn-soft mt-1 w-full" onClick={() => setAdding(true)}>
            <Plus size={19} /> I’m not listed
          </button>
        </div>
      )}
    </Sheet>
  )
}
