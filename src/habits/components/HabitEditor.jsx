import { useState } from 'react'
import Orb from './Orb.jsx'
import { EMOJIS, PALETTES, PALETTE_IDS } from '../lib/habits.js'
import { WEEKDAYS } from '../lib/dates.js'
import { haptic, sfx } from '../lib/fx.js'

const PRESETS = [
  ['Every day', [true, true, true, true, true, true, true]],
  ['Weekdays', [false, true, true, true, true, true, false]],
  ['Weekends', [true, false, false, false, false, false, true]],
]

export default function HabitEditor({ initial, isNew, onSave, onCancel, onMove }) {
  const [h, setH] = useState(initial)
  const set = (patch) => setH((x) => ({ ...x, ...patch }))
  const tap = () => {
    haptic('tick')
    sfx.soft()
  }
  const valid = h.name.trim() && h.days.some(Boolean)

  return (
    <div className="editor">
      <div className="sheet-head">
        <button className="link" onClick={onCancel}>
          Cancel
        </button>
        <h2>{isNew ? 'New habit' : 'Edit habit'}</h2>
        <button className="link strong" disabled={!valid} onClick={() => onSave({ ...h, name: h.name.trim() })}>
          {isNew ? 'Add' : 'Save'}
        </button>
      </div>

      <div className="editor-preview" style={{ '--c': PALETTES[h.color].mid }}>
        <span className="orb-glow" />
        <Orb color={h.color} level={0.62} />
        <span className="orb-emoji">{h.emoji}</span>
      </div>

      <input
        className="name-input"
        value={h.name}
        onChange={(e) => set({ name: e.target.value })}
        placeholder="Name your habit"
        maxLength={40}
        autoFocus={isNew}
        enterKeyHint="done"
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />

      <section className="field">
        <label>Color</label>
        <div className="swatches">
          {PALETTE_IDS.map((id) => (
            <button
              key={id}
              className={`swatch ${h.color === id ? 'on' : ''}`}
              style={{ '--a': PALETTES[id].light, '--b': PALETTES[id].mid, '--d': PALETTES[id].dark }}
              aria-label={PALETTES[id].name}
              onClick={() => {
                tap()
                set({ color: id })
              }}
            />
          ))}
        </div>
      </section>

      <section className="field">
        <label>Icon</label>
        <div className="emoji-grid">
          {EMOJIS.map((e) => (
            <button
              key={e}
              className={h.emoji === e ? 'on' : ''}
              onClick={() => {
                tap()
                set({ emoji: e })
              }}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          className="emoji-custom"
          placeholder="…or type any emoji"
          maxLength={8}
          onChange={(e) => {
            const v = [...new Intl.Segmenter().segment(e.target.value)].pop()?.segment
            if (v) set({ emoji: v })
          }}
        />
      </section>

      <section className="field">
        <label>Times per day</label>
        <div className="stepper">
          <button
            onClick={() => {
              tap()
              set({ goal: Math.max(1, h.goal - 1) })
            }}
            disabled={h.goal <= 1}
          >
            −
          </button>
          <span>
            <b>{h.goal}</b> {h.goal === 1 ? 'time' : 'times'}
          </span>
          <button
            onClick={() => {
              tap()
              set({ goal: Math.min(30, h.goal + 1) })
            }}
          >
            +
          </button>
        </div>
      </section>

      <section className="field">
        <label>Repeat on</label>
        <div className="days">
          {WEEKDAYS.map((d, i) => (
            <button
              key={i}
              className={h.days[i] ? 'on' : ''}
              onClick={() => {
                tap()
                set({ days: h.days.map((v, j) => (j === i ? !v : v)) })
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="chips">
          {PRESETS.map(([label, days]) => (
            <button
              key={label}
              className={`chip ${String(days) === String(h.days) ? 'on' : ''}`}
              onClick={() => {
                tap()
                set({ days: [...days] })
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {!isNew && onMove && (
        <section className="field">
          <label>Order</label>
          <div className="chips">
            <button className="chip" onClick={() => (tap(), onMove(-1))}>
              ↑ Move earlier
            </button>
            <button className="chip" onClick={() => (tap(), onMove(1))}>
              ↓ Move later
            </button>
          </div>
        </section>
      )}

      <button className="big-btn" disabled={!valid} onClick={() => onSave({ ...h, name: h.name.trim() })}>
        {isNew ? 'Add habit' : 'Save changes'}
      </button>
    </div>
  )
}
