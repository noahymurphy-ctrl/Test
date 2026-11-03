import { useCallback, useEffect, useMemo, useState } from 'react'
import { House, Plus, ReceiptText, Settings as SettingsIcon, Share, UsersRound, X } from 'lucide-react'
import { NavContext } from './lib/nav'
import { enableSync, getState, leaveSync, replaceAll, retrySync, setLocal, startSync, useStore } from './lib/store'
import { parseInvite } from './lib/invite'
import { haptic, toast } from './lib/fx'
import { debts } from './lib/balances'
import { Avatar, Empty, Toaster } from './components/ui'
import { Logo } from './components/Logo'
import { SyncDot } from './components/SyncDot'
import Home from './screens/Home'
import Activity from './screens/Activity'
import People, { AddPersonSheet, IdentitySheet, PersonSheet } from './screens/People'
import Settings from './screens/Settings'
import Composer from './screens/Composer'
import TxnDetail from './screens/TxnDetail'
import Onboarding from './screens/Onboarding'

const TABS = [
  { id: 'home', label: 'Home', Icon: House, key: '1' },
  { id: 'activity', label: 'Activity', Icon: ReceiptText, key: '2' },
  { id: 'people', label: 'Family', Icon: UsersRound, key: '3' },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon, key: '4' },
]

const inviteFromHash = () => location.hash.match(/join=[A-Za-z0-9_-]+/)?.[0] || null
let invitePrompted = false

export default function App() {
  const s = useStore()
  const [tab, setTab] = useState('home')
  const [composer, setComposer] = useState(null)
  const [txnId, setTxnId] = useState(null)
  const [personId, setPersonId] = useState(null)
  const [identityOpen, setIdentityOpen] = useState(false)
  const [addPersonOpen, setAddPersonOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [invite] = useState(inviteFromHash)

  const go = useCallback((t) => {
    setTab(t)
    window.scrollTo({ top: 0 })
  }, [])
  const openComposer = useCallback((preset) => setComposer((c) => ({ open: true, key: (c?.key || 0) + 1, preset })), [])
  const nav = useMemo(
    () => ({
      go,
      openComposer,
      openTxn: setTxnId,
      openPerson: setPersonId,
      openIdentity: () => setIdentityOpen(true),
      openAddPerson: () => setAddPersonOpen(true),
    }),
    [go, openComposer],
  )

  // Connect to family sync if configured.
  useEffect(() => {
    startSync()
    const onVis = () => document.visibilityState === 'visible' && getState().sync.state === 'error' && retrySync()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // An invite link opened by someone who already uses Evenly.
  useEffect(() => {
    const parsed = parseInvite(invite)
    const st = getState()
    if (!parsed || invitePrompted || (!st.local.onboarded && !st.members.length)) return
    invitePrompted = true
    if (st.local.sync?.familyId === parsed.familyId) return
    if (confirm(`Join “${parsed.name || 'this family'}” on Evenly? This replaces what’s on this device with the shared family ledger.`)) {
      leaveSync().then(() => {
        replaceAll({})
        setLocal({ me: null, onboarded: true })
        enableSync(parsed.config, parsed.familyId)
      })
    } else history.replaceState(null, '', location.pathname)
  }, [invite])

  // Theme.
  const theme = s.local.theme || 'system'
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
        m.content = dark ? '#0C0B12' : '#F5F4FA'
        if (theme !== 'system') m.removeAttribute('media')
      })
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  // Compact title bar on scroll (mobile).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Keyboard shortcuts (Mac).
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input,textarea,select,[contenteditable]')) return
      if (Number(document.body.dataset.sheets || 0) > 0) return
      const t = TABS.find((x) => x.key === e.key)
      if (t) go(t.id)
      else if (e.key === 'n') openComposer()
      else if (e.key === 's') {
        const st = getState()
        const d = debts(st.txns, st.meta.simplify).find((x) => x.from === st.me || x.to === st.me)
        openComposer(d ? { mode: 'settle', from: d.from, to: d.to, amount: d.amount, step: 2 } : { mode: 'settle' })
      } else if (e.key === '/') {
        go('activity')
        setTimeout(() => document.getElementById('activity-search')?.focus(), 50)
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, openComposer])

  // New version available.
  useEffect(() => {
    const onUpdate = (e) =>
      toast('A fresh version of Evenly is ready', {
        icon: '✨',
        action: 'Update',
        duration: 15000,
        onAction: () => e.detail?.postMessage('SKIP_WAITING'),
      })
    window.addEventListener('evenly:update', onUpdate)
    return () => window.removeEventListener('evenly:update', onUpdate)
  }, [])

  if (!s.local.onboarded && !s.members.length) {
    return (
      <>
        <Onboarding invite={invite} />
        <Toaster />
      </>
    )
  }

  const waitingForFamily = s.local.sync && !s.members.length
  const needsIdentity = !s.me && s.members.length > 0
  const current = TABS.find((t) => t.id === tab)

  return (
    <NavContext.Provider value={nav}>
      <div className="md:flex">
        <Sidebar tab={tab} go={go} openComposer={openComposer} />

        <div
          className={`glass fixed inset-x-0 top-0 z-30 border-b border-line pt-[var(--sat)] transition-opacity duration-200 md:hidden ${scrolled ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <div className="flex h-11 items-center justify-center text-[16px] font-semibold">{tab === 'home' ? s.meta.name : current.label}</div>
        </div>

        <main className="min-w-0 flex-1 px-4 pt-[calc(var(--sat)+14px)] pb-[calc(var(--sab)+112px)] md:px-10 md:pt-10 md:pb-16">
          <div className="mx-auto max-w-[1080px]">
            {waitingForFamily ? (
              <JoinWaiting />
            ) : (
              <div key={tab} className="rise">
                {tab === 'home' && <InstallHint />}
                {tab === 'home' && <Home />}
                {tab === 'activity' && <Activity />}
                {tab === 'people' && <People />}
                {tab === 'settings' && <Settings />}
              </div>
            )}
          </div>
        </main>

        <TabBar tab={tab} go={go} openComposer={openComposer} />
      </div>

      <Composer state={composer} onClose={() => setComposer((c) => c && { ...c, open: false })} onAddPeople={() => (go('people'), setAddPersonOpen(true))} />
      <TxnDetail id={txnId} onClose={() => setTxnId(null)} />
      <PersonSheet id={personId} onClose={() => setPersonId(null)} />
      <AddPersonSheet open={addPersonOpen} onClose={() => setAddPersonOpen(false)} />
      <IdentitySheet open={identityOpen || needsIdentity} forced={needsIdentity} onClose={() => setIdentityOpen(false)} />
      <Toaster />
    </NavContext.Provider>
  )
}

function TabBar({ tab, go, openComposer }) {
  const item = (t) => (
    <button
      key={t.id}
      onClick={() => {
        haptic()
        go(t.id)
      }}
      className={`flex flex-1 flex-col items-center gap-0.5 pt-2 transition-colors ${tab === t.id ? 'text-accent' : 'text-ink-3'}`}
      aria-current={tab === t.id ? 'page' : undefined}
    >
      <t.Icon size={25} strokeWidth={tab === t.id ? 2.4 : 2} className={`transition-transform duration-300 ease-spring ${tab === t.id ? 'scale-110' : ''}`} />
      <span className="text-[10.5px] font-semibold">{t.label}</span>
    </button>
  )
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[max(var(--sab),8px)] md:hidden" aria-label="Tabs">
      <div className="mx-auto flex max-w-[520px] items-start px-2">
        {TABS.slice(0, 2).map(item)}
        <div className="flex flex-1 justify-center">
          <button
            onClick={() => {
              haptic(12)
              openComposer()
            }}
            className="press -mt-5 grid h-[60px] w-[60px] place-items-center rounded-[22px] bg-gradient-to-br from-[#6d5bff] via-[#a35bff] to-[#ff6fb1] text-white shadow-[0_10px_24px_-8px_rgba(109,91,255,0.8)]"
            aria-label="New entry"
          >
            <Plus size={30} strokeWidth={2.8} />
          </button>
        </div>
        {TABS.slice(2).map(item)}
      </div>
    </nav>
  )
}

function Sidebar({ tab, go, openComposer }) {
  const { meta, memberMap, me } = useStore()
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-[264px] shrink-0 flex-col border-r border-line bg-bg-2/40 px-4 pt-8 pb-5 md:flex">
      <div className="flex items-center gap-3 px-2">
        <Logo size={40} className="wiggle" />
        <div className="min-w-0">
          <div className="title text-[21px] leading-tight font-extrabold">Evenly</div>
          <div className="truncate text-[13px] text-ink-2">{meta.name}</div>
        </div>
      </div>
      <button className="btn btn-primary mt-7 w-full" onClick={() => openComposer()}>
        <Plus size={20} strokeWidth={2.8} /> New entry
        <kbd className="ml-auto rounded-md bg-white/20 px-1.5 text-[12px] font-semibold">N</kbd>
      </button>
      <nav className="mt-5 flex flex-col gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15.5px] font-semibold transition-colors ${tab === t.id ? 'bg-card text-accent shadow-card' : 'text-ink-2 hover:bg-card/60 hover:text-ink'}`}
          >
            <t.Icon size={20} strokeWidth={2.2} />
            <span className="flex-1 text-left">{t.label}</span>
            <kbd className="text-[12px] font-medium text-ink-3">{t.key}</kbd>
          </button>
        ))}
      </nav>
      <div className="flex-1" />
      {memberMap[me] && (
        <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
          <Avatar member={memberMap[me]} size={38} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold">{memberMap[me].name}</div>
            <div className="mt-0.5">
              <SyncDot />
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function JoinWaiting() {
  const { sync } = useStore()
  if (sync.state === 'error') {
    return (
      <Empty emoji="🔌" title="Couldn’t reach your family" body={sync.message}>
        <div className="flex flex-col gap-2">
          <button className="btn btn-primary" onClick={retrySync}>
            Try again
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              leaveSync()
              setLocal({ onboarded: false })
              history.replaceState(null, '', location.pathname)
            }}
          >
            Start over
          </button>
        </div>
      </Empty>
    )
  }
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <Logo size={84} className="float" />
      <div className="title mt-6 text-[22px] font-bold">Connecting to your family…</div>
      <p className="mt-1.5 text-ink-2">Pulling down everyone’s balances.</p>
    </div>
  )
}

function InstallHint() {
  const { local } = useStore()
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches
  if (!isIOS || standalone || local.installDismissed) return null
  return (
    <div className="card rise mb-4 flex items-center gap-3 p-3.5">
      <Logo size={44} />
      <div className="min-w-0 flex-1 text-[14px] leading-snug">
        <div className="font-bold">Add Evenly to your Home Screen</div>
        <div className="text-ink-2">
          Tap <Share size={13} className="-mt-0.5 inline text-accent" /> then “Add to Home Screen”
        </div>
      </div>
      <button aria-label="Dismiss" className="press grid h-8 w-8 place-items-center rounded-full bg-card-2" onClick={() => setLocal({ installDismissed: true })}>
        <X size={16} />
      </button>
    </div>
  )
}
