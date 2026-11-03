import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'

const LOOK = {
  live: ['bg-pos', 'Synced'],
  connecting: ['bg-amber-400 animate-pulse', 'Syncing'],
  offline: ['bg-amber-400', 'Offline'],
  error: ['bg-neg', 'Sync issue'],
}

export function SyncDot() {
  const { sync, local } = useStore()
  const nav = useNav()
  if (!local.sync || !LOOK[sync.state]) return null
  const [dot, label] = LOOK[sync.state]
  return (
    <button onClick={() => nav.go('settings')} className="press flex items-center gap-1.5 rounded-full bg-card px-2 py-0.5 text-[12px] font-semibold text-ink-2 shadow-card">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </button>
  )
}
