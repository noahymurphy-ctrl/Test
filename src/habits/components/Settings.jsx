import { useRef, useState } from 'react'
import { haptic, sfx, unlockAudio } from '../lib/fx.js'

function Toggle({ label, sub, value, onChange }) {
  return (
    <button
      className="setting"
      role="switch"
      aria-checked={value}
      onClick={() => {
        unlockAudio()
        onChange(!value)
      }}
    >
      <span>
        <b>{label}</b>
        {sub && <small>{sub}</small>}
      </span>
      <span className={`toggle ${value ? 'on' : ''}`}>
        <span />
      </span>
    </button>
  )
}

export default function Settings({ s, dispatch, onDone, toast }) {
  const file = useRef(null)
  const [confirm, setConfirm] = useState(false)
  const set = (patch) => dispatch({ type: 'settings', patch })

  const exportData = async () => {
    const data = JSON.stringify({ app: 'glow', version: 1, exported: new Date().toISOString(), habits: s.habits, log: s.log }, null, 2)
    const name = `glow-backup-${new Date().toISOString().slice(0, 10)}.json`
    const blob = new Blob([data], { type: 'application/json' })
    const f = new File([blob], name, { type: 'application/json' })
    if (navigator.canShare?.({ files: [f] })) {
      try {
        await navigator.share({ files: [f], title: 'Glow backup' })
        return
      } catch (e) {
        if (e.name === 'AbortError') return
      }
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }

  const importData = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      if (!Array.isArray(data.habits) || typeof data.log !== 'object') throw new Error('bad file')
      dispatch({ type: 'replace', state: { ...s, habits: data.habits, log: data.log } })
      haptic('success')
      toast('📦', `Restored ${data.habits.length} habits`)
    } catch {
      haptic('error')
      toast('⚠️', "That file isn't a Glow backup")
    }
  }

  return (
    <div className="settings">
      <div className="sheet-head">
        <span />
        <h2>Settings</h2>
        <button className="link strong" onClick={onDone}>
          Done
        </button>
      </div>

      <div className="group">
        <Toggle
          label="Sounds"
          sub="Plinks, pops and fanfares"
          value={s.settings.sound}
          onChange={(v) => {
            set({ sound: v })
            if (v) setTimeout(() => sfx.pop(true), 30)
          }}
        />
        <Toggle
          label="Haptics"
          sub="Needs iOS 18 or later on iPhone"
          value={s.settings.haptics}
          onChange={(v) => {
            set({ haptics: v })
            if (v) setTimeout(() => haptic('success'), 30)
          }}
        />
      </div>

      <div className="group">
        <p className="group-label">Theme</p>
        <div className="segmented">
          {[
            ['system', 'Auto'],
            ['dark', 'Night'],
            ['light', 'Day'],
          ].map(([v, l]) => (
            <button
              key={v}
              className={s.settings.theme === v ? 'on' : ''}
              onClick={() => {
                haptic('tick')
                set({ theme: v })
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="group">
        <p className="group-label">Your data stays on this phone</p>
        <button className="setting" onClick={exportData}>
          <span>
            <b>Export backup</b>
            <small>Save a .json file to Files or iCloud</small>
          </span>
          <span className="chev">›</span>
        </button>
        <button className="setting" onClick={() => file.current?.click()}>
          <span>
            <b>Import backup</b>
            <small>Replaces everything on this phone</small>
          </span>
          <span className="chev">›</span>
        </button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={importData} />
        <button
          className={`setting danger ${confirm ? 'armed' : ''}`}
          onClick={() => {
            if (!confirm) {
              haptic('medium')
              setConfirm(true)
              setTimeout(() => setConfirm(false), 3000)
              return
            }
            haptic('heavy')
            sfx.whoosh()
            dispatch({ type: 'reset' })
            onDone()
          }}
        >
          <span>
            <b>{confirm ? 'Tap again to erase everything' : 'Erase all data'}</b>
          </span>
        </button>
      </div>

      <div className="group tips">
        <p className="group-label">Tips</p>
        <p>
          <b>Press and hold</b> an orb to fill it. Hold a full one to drain it.
        </p>
        <p>
          <b>Tap a habit's name</b> for its streaks, calendar and history.
        </p>
        <p>
          <b>Tap a day</b> in the week strip to catch up on past days.
        </p>
        <p>
          On iPhone: Safari → Share → <b>Add to Home Screen</b> to install.
        </p>
      </div>
    </div>
  )
}
