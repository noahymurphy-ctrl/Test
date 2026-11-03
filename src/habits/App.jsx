import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from './lib/store.js'
import { WEEKDAYS, addDays, dayTitle, fromKey, key, longDate, today } from './lib/dates.js'
import { MILESTONES, PALETTES, STARTERS, countOf, daySummary, isDue, newHabit, streak } from './lib/habits.js'
import { configureFx, confetti, haptic, sfx, burst, unlockAudio } from './lib/fx.js'
import HabitOrb from './components/HabitOrb.jsx'
import Orb from './components/Orb.jsx'
import Ring, { RingDefs } from './components/Ring.jsx'
import Sheet from './components/Sheet.jsx'
import HabitEditor from './components/HabitEditor.jsx'
import HabitDetail from './components/HabitDetail.jsx'
import Progress from './components/Progress.jsx'
import Settings from './components/Settings.jsx'

const ALL_COLORS = Object.values(PALETTES).flatMap((p) => [p.light, p.mid])

function useTodayKey() {
  const [k, setK] = useState(() => key(today()))
  useEffect(() => {
    const check = () => setK(key(today()))
    const id = setInterval(check, 30_000)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [])
  return k
}

function useTheme(pref) {
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const light = pref === 'light' || (pref === 'system' && mq.matches)
      document.documentElement.classList.toggle('light', light)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f4f1fb' : '#07060d')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [pref])
}

function greeting(sum) {
  if (!sum.due) return 'Nothing scheduled. Enjoy the rest.'
  if (sum.perfect) return 'Everything done. You’re glowing ✨'
  if (sum.done === 0) return 'Press and hold to fill your first orb.'
  if (sum.frac >= 0.5) return `${sum.due - sum.done} to go. Nearly there!`
  return `${sum.done} of ${sum.due} done. Keep it rolling.`
}

export default function App() {
  const [s, dispatch] = useStore()
  const todayKey = useTodayKey()
  const [tab, setTab] = useState('today')
  const [dayKey, setDayKey] = useState(todayKey)
  const [sheet, setSheet] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const toastTimer = useRef(0)
  const prevToday = useRef(todayKey)

  useEffect(() => configureFx(s.settings), [s.settings])
  useTheme(s.settings.theme)

  // Roll the selected day forward at midnight if the user was looking at "today".
  useEffect(() => {
    if (prevToday.current !== todayKey) {
      setDayKey((d) => (d === prevToday.current ? todayKey : d))
      prevToday.current = todayKey
    }
  }, [todayKey])

  const toast = useCallback((icon, text) => {
    clearTimeout(toastTimer.current)
    setToastMsg({ icon, text, id: Math.random() })
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400)
  }, [])

  const openSheet = (v) => {
    unlockAudio()
    haptic('light')
    setSheet(v)
    setSheetOpen(true)
  }
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  const onExited = useCallback(() => setSheet(null), [])

  const date = fromKey(dayKey)
  const summary = daySummary(s.habits, s.log, date)
  const dueHabits = s.habits.filter((h) => isDue(h, date))
  const restHabits = s.habits.filter((h) => !isDue(h, date))

  const week = useMemo(() => {
    const t = fromKey(todayKey)
    return Array.from({ length: 7 }, (_, i) => addDays(t, i - 6))
  }, [todayKey])

  const commit = (habit, next, rect) => {
    const prev = countOf(s.log, dayKey, habit.id)
    dispatch({ type: 'set', day: dayKey, id: habit.id, count: next })
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.width / 2
    const r = rect.width / 2
    const p = PALETTES[habit.color]

    if (next < prev) {
      sfx.undo()
      haptic('medium')
      burst(cx, cy, ['rgba(160,160,180,.9)', 'rgba(120,120,140,.8)'], { count: 10, power: 0.5, radius: r * 0.6 })
      return
    }
    const reached = next >= habit.goal && prev < habit.goal
    sfx.pop(reached)
    haptic(reached ? 'success' : 'medium')
    burst(cx, cy, [p.light, p.mid, p.light, '#ffffff'], { count: reached ? 46 : 14, power: reached ? 1.25 : 0.65, radius: r })
    if (!reached) return

    const log = { ...s.log, [dayKey]: { ...s.log[dayKey], [habit.id]: next } }
    const before = daySummary(s.habits, s.log, date)
    const after = daySummary(s.habits, log, date)
    const st = streak(habit, log, fromKey(todayKey))
    if (after.perfect && !before.perfect) {
      setTimeout(() => {
        confetti(ALL_COLORS)
        sfx.fanfare()
        haptic('heavy')
        toast('✨', dayKey === todayKey ? 'Perfect day!' : `Perfect ${dayTitle(dayKey, todayKey)}!`)
      }, 420)
    } else if (dayKey === todayKey && MILESTONES.includes(st)) {
      setTimeout(() => {
        confetti([p.light, p.mid, p.dark, '#fff'])
        sfx.fanfare()
        toast('🔥', `${st}-day ${habit.name} streak!`)
      }, 420)
    }
  }

  const hint = (el) => {
    el?.animate(
      [{ transform: 'rotate(0)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }],
      { duration: 380, easing: 'ease-out' },
    )
    haptic('light')
    if (!s.hinted || Math.random() < 0.5) toast('✋', 'Press and hold to fill')
    dispatch({ type: 'hinted' })
  }

  const [picked, setPicked] = useState([])
  const toggleStarter = (name) => {
    unlockAudio()
    haptic('light')
    sfx.soft()
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]))
  }
  const addPicked = () => {
    STARTERS.filter((st) => picked.includes(st.name)).forEach((st, i) => dispatch({ type: 'add', habit: newHabit(st, i) }))
    setPicked([])
    haptic('success')
    sfx.pop(true)
  }

  const saveHabit = (h, isNew) => {
    dispatch({ type: isNew ? 'add' : 'update', habit: h })
    haptic('success')
    sfx.pop(true)
    if (isNew) toast(h.emoji, `${h.name} added`)
    closeSheet()
  }

  const renderSheet = () => {
    if (!sheet) return null
    if (sheet.type === 'edit') {
      const isNew = !sheet.habit
      return (
        <HabitEditor
          key={sheet.habit?.id || 'new'}
          initial={sheet.habit || newHabit({}, s.habits.length)}
          isNew={isNew}
          onCancel={closeSheet}
          onSave={(h) => saveHabit(h, isNew)}
          onMove={(by) => dispatch({ type: 'move', id: sheet.habit.id, by })}
        />
      )
    }
    if (sheet.type === 'detail') {
      const habit = s.habits.find((h) => h.id === sheet.id)
      if (!habit) return null
      return (
        <HabitDetail
          habit={habit}
          log={s.log}
          dispatch={dispatch}
          todayKey={todayKey}
          onEdit={() => setSheet({ type: 'edit', habit })}
          onClose={closeSheet}
        />
      )
    }
    if (sheet.type === 'settings') return <Settings s={s} dispatch={dispatch} onDone={closeSheet} toast={toast} />
    return null
  }

  const orb = (h, dim) => (
    <HabitOrb
      key={h.id}
      habit={h}
      count={countOf(s.log, dayKey, h.id)}
      streak={streak(h, s.log, fromKey(todayKey))}
      dim={dim}
      onCommit={(next, rect) => commit(h, next, rect)}
      onOpen={() => openSheet({ type: 'detail', id: h.id })}
      onHint={hint}
    />
  )

  return (
    <div className="app">
      <RingDefs />
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <main className="scroller">
        {tab === 'today' ? (
          <div className="today">
            <header className="top">
              <div>
                <p className="eyebrow">{longDate(dayKey)}</p>
                <h1>{dayTitle(dayKey, todayKey)}</h1>
              </div>
              <div className="top-actions">
                <Ring value={summary.frac} size={52} stroke={6} className={summary.perfect ? 'perfect' : ''}>
                  {summary.perfect ? '✨' : `${Math.round(summary.frac * 100)}%`}
                </Ring>
                <button className="icon-btn round" onClick={() => openSheet({ type: 'settings' })} aria-label="Settings">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>
            </header>

            <div className="week">
              {week.map((d) => {
                const k = key(d)
                const sum = daySummary(s.habits, s.log, d)
                return (
                  <button
                    key={k}
                    className={`week-day ${k === dayKey ? 'on' : ''} ${sum.perfect ? 'perfect' : ''}`}
                    onClick={() => {
                      unlockAudio()
                      haptic('tick')
                      sfx.soft()
                      setDayKey(k)
                    }}
                  >
                    <span className="wd">{k === todayKey ? 'Today' : WEEKDAYS[d.getDay()]}</span>
                    <Ring value={sum.frac} size={36} stroke={4}>
                      {d.getDate()}
                    </Ring>
                  </button>
                )
              })}
            </div>

            {s.habits.length > 0 && <p className="greeting">{greeting(summary)}</p>}

            {s.habits.length === 0 ? (
              <div className="empty">
                <div className="empty-orb">
                  <span className="orb-glow" />
                  <Orb color="grape" level={0.45} />
                  <span className="orb-emoji">✨</span>
                </div>
                <h2>Let’s build some glow</h2>
                <p>Pick a few to start, or make your own.</p>
                <div className="starters">
                  {STARTERS.map((st) => (
                    <button
                      key={st.name}
                      className={`starter ${picked.includes(st.name) ? 'on' : ''}`}
                      style={{ '--c': PALETTES[st.color].mid }}
                      aria-pressed={picked.includes(st.name)}
                      onClick={() => toggleStarter(st.name)}
                    >
                      <span>{st.emoji}</span>
                      {st.name}
                    </button>
                  ))}
                </div>
                {picked.length > 0 ? (
                  <button className="big-btn" onClick={addPicked}>
                    Add {picked.length} {picked.length === 1 ? 'habit' : 'habits'}
                  </button>
                ) : (
                  <button className="big-btn ghost" onClick={() => openSheet({ type: 'edit' })}>
                    Create your own
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid">
                  {dueHabits.map((h) => orb(h, false))}
                  <button className="add-tile" onClick={() => openSheet({ type: 'edit' })}>
                    <span className="add-orb">+</span>
                    <span className="habit-name">New habit</span>
                  </button>
                </div>
                {restHabits.length > 0 && (
                  <>
                    <h3 className="section-title">Not scheduled {dayKey === todayKey ? 'today' : 'this day'}</h3>
                    <div className="grid small">{restHabits.map((h) => orb(h, true))}</div>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          <Progress s={s} onOpen={(id) => openSheet({ type: 'detail', id })} />
        )}
      </main>

      <nav className="tabbar">
        <button
          className={tab === 'today' ? 'on' : ''}
          onClick={() => {
            haptic('tick')
            setTab('today')
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
          </svg>
          Today
        </button>
        <button
          className="fab"
          aria-label="New habit"
          onClick={() => {
            sfx.soft()
            openSheet({ type: 'edit' })
          }}
        >
          +
        </button>
        <button
          className={tab === 'progress' ? 'on' : ''}
          onClick={() => {
            haptic('tick')
            setTab('progress')
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5 19V11M12 19V5M19 19v-6" />
          </svg>
          Progress
        </button>
      </nav>

      {toastMsg && (
        <div key={toastMsg.id} className="toast" role="status">
          <span>{toastMsg.icon}</span>
          {toastMsg.text}
        </div>
      )}

      <Sheet open={sheetOpen} onClose={closeSheet} onExited={onExited}>
        {renderSheet()}
      </Sheet>
    </div>
  )
}
