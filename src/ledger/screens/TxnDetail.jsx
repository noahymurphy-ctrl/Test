import { Copy, Pencil, Trash2 } from 'lucide-react'
import { Avatar, Money, Sheet } from '../components/ui'
import { describe } from '../lib/describe'
import { put, remove, restore, uid, useStore, todayISO } from '../lib/store'
import { dayLabel, timeAgo } from '../lib/dates'
import { firstName } from '../lib/flair'
import { useNav } from '../lib/nav'
import { toast } from '../lib/fx'

export default function TxnDetail({ id, onClose }) {
  const { records } = useStore()
  const t = id && records[id]
  return (
    <Sheet open={!!id && !!t && !t.deleted} onClose={onClose} title="" label="Entry details">
      {t && <Body t={t} onClose={onClose} />}
    </Sheet>
  )
}

function Body({ t, onClose }) {
  const { memberMap, me, meta } = useStore()
  const nav = useNav()
  const cur = meta.currency
  const payer = memberMap[t.paidBy]
  const creator = memberMap[t.createdBy]
  const label = (id) => (id === me ? 'You' : memberMap[id]?.name || 'Someone')

  const del = () => {
    remove(t.id)
    onClose()
    toast(`Deleted ${t.title}`, { icon: '🗑️', action: 'Undo', onAction: () => restore(t.id) })
  }

  const duplicate = () => {
    const rest = { ...t }
    delete rest.createdAt
    delete rest.updatedAt
    put({ ...rest, id: uid(), date: todayISO(), createdBy: me })
    onClose()
    toast(`Added ${t.title} again`, { icon: t.emoji })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center text-center">
        <div className={`pop grid h-20 w-20 place-items-center rounded-[26px] text-[42px] ${t.type === 'payment' ? 'bg-pos-soft' : 'bg-card shadow-card'}`}>{t.emoji}</div>
        <h2 className="title mt-3 text-[24px] font-bold">{t.title}</h2>
        <Money cents={t.amount} currency={cur} className="text-[44px] leading-tight font-extrabold" />
        <div className="text-[15px] text-ink-2">
          {describe(t, me, memberMap)} · {dayLabel(t.date)}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar member={payer} size={40} />
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-ink-3 uppercase">{t.type === 'payment' ? 'Paid by' : t.splitMode === 'iou' ? 'Lent by' : 'Paid by'}</div>
            <div className="font-semibold">{label(t.paidBy)}</div>
          </div>
          <Money cents={t.amount} currency={cur} className="text-[17px] font-bold text-pos" />
        </div>
        {Object.entries(t.splits).map(([id, share]) => (
          <div key={id} className="flex items-center gap-3 border-t border-line px-4 py-3">
            <Avatar member={memberMap[id]} size={40} />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-ink-3 uppercase">{t.type === 'payment' ? 'Received' : id === t.paidBy ? 'Their own share' : t.splitMode === 'iou' ? 'Borrowed' : 'Share'}</div>
              <div className="font-semibold">{label(id)}</div>
            </div>
            <Money cents={share} currency={cur} className={`text-[17px] font-bold ${id === t.paidBy ? 'text-ink-3' : t.type === 'payment' ? 'text-ink' : 'text-neg'}`} />
          </div>
        ))}
      </div>

      {t.note && <div className="card px-4 py-3.5 text-[15px] whitespace-pre-wrap">{t.note}</div>}

      <div className="text-center text-[13px] text-ink-3">
        Added {creator ? `by ${t.createdBy === me ? 'you' : firstName(creator.name)} ` : ''}
        {timeAgo(t.createdAt)}
        {t.updatedAt - t.createdAt > 5000 ? ` · edited ${timeAgo(t.updatedAt)}` : ''}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button className="btn btn-soft flex-col gap-1 !h-16 text-[13px]" onClick={() => (onClose(), nav.openComposer({ txn: t }))}>
          <Pencil size={19} /> Edit
        </button>
        <button className="btn btn-ghost flex-col gap-1 !h-16 text-[13px]" onClick={duplicate}>
          <Copy size={19} /> Again
        </button>
        <button className="btn btn-ghost flex-col gap-1 !h-16 text-[13px] text-neg" onClick={del}>
          <Trash2 size={19} /> Delete
        </button>
      </div>
    </div>
  )
}
