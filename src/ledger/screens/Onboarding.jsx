import { useState } from 'react'
import { ArrowLeft, ArrowRight, ClipboardPaste, Plus, X } from 'lucide-react'
import { Avatar } from '../components/ui'
import { Logo } from '../components/Logo'
import { MemberEditor } from './People'
import { enableSync, put, replaceAll, setLocal, uid } from '../lib/store'
import { AVATARS, TINTS, firstName, pick } from '../lib/flair'
import { CURRENCIES } from '../lib/money'
import { parseInvite } from '../lib/invite'
import { celebrate, haptic } from '../lib/fx'

const QUICK = ['Mom', 'Dad', 'Grandma', 'Grandpa', 'Sister', 'Brother', 'Partner']
const ORBIT = ['🦊', '🐼', '🦄', '🐸', '🐙', '🐝']

function guessCurrency() {
  const region = (navigator.language || 'en-US').split('-')[1]
  const map = { US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', MX: 'MXN', JP: 'JPY', IN: 'INR', CH: 'CHF', SE: 'SEK', BR: 'BRL', ZA: 'ZAR', SG: 'SGD', PH: 'PHP' }
  return map[region] || (['DE', 'FR', 'ES', 'IT', 'NL', 'IE', 'PT', 'AT', 'BE', 'FI'].includes(region) ? 'EUR' : 'USD')
}

export default function Onboarding({ invite }) {
  const [step, setStep] = useState(invite ? 'join' : 'welcome')
  const [me, setMe] = useState(null)
  const [family, setFamily] = useState([])
  const [draft, setDraft] = useState('')
  const [crew, setCrew] = useState('')
  const [currency, setCurrency] = useState(guessCurrency)
  const [joinText, setJoinText] = useState(invite || '')
  const [joining, setJoining] = useState(false)
  const parsed = parseInvite(joinText)

  const addPerson = (name) => {
    if (!name.trim()) return
    haptic()
    setFamily((f) => [...f, { id: uid(), name: name.trim(), emoji: pick(AVATARS.filter((a) => a !== me?.emoji)), color: pick(TINTS) }])
    setDraft('')
  }

  const finish = () => {
    const now = Date.now()
    const meId = uid()
    put({ id: 'meta', kind: 'meta', name: crew.trim() || `${firstName(me.name)}’s Family`, currency, simplify: true })
    put({ id: meId, kind: 'member', ...me, createdAt: now })
    family.forEach((m, i) => put({ ...m, kind: 'member', createdAt: now + i + 1 }))
    setLocal({ me: meId, onboarded: true })
    setTimeout(() => celebrate({ count: 200 }), 150)
  }

  const join = async () => {
    if (!parsed) return
    setJoining(true)
    replaceAll({})
    setLocal({ me: null, onboarded: true })
    await enableSync(parsed.config, parsed.familyId)
  }

  const paste = async () => {
    try {
      setJoinText(await navigator.clipboard.readText())
    } catch {
      /* permission denied */
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden px-6 pt-[calc(var(--sat)+20px)] pb-[calc(var(--sab)+24px)]">
      <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[#a35bff] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#ff6fb1] opacity-20 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col">
        {step !== 'welcome' && (
          <button
            className="press -ml-2 grid h-10 w-10 place-items-center rounded-full"
            aria-label="Back"
            onClick={() => setStep({ you: 'welcome', family: 'you', crew: 'family', join: 'welcome' }[step])}
          >
            <ArrowLeft size={24} />
          </button>
        )}

        {step === 'welcome' && (
          <div key="w" className="rise flex flex-1 flex-col items-center justify-center text-center">
            <div className="relative mb-8 grid h-48 w-48 place-items-center">
              {ORBIT.map((e, i) => (
                <span
                  key={e}
                  className="absolute text-[30px]"
                  style={{ transform: `rotate(${i * 60 - 90}deg) translate(92px) rotate(${90 - i * 60}deg)` }}
                >
                  <span className="float inline-block" style={{ animationDelay: `${i * -0.7}s` }}>
                    <span className="pop inline-block" style={{ animationDelay: `${0.2 + i * 0.07}s` }}>
                      {e}
                    </span>
                  </span>
                </span>
              ))}
              <Logo size={104} className="pop drop-shadow-2xl" />
            </div>
            <h1 className="title text-[44px] leading-none font-extrabold">Evenly</h1>
            <p className="mt-3 max-w-[300px] text-[18px] leading-snug text-ink-2">Who owes who, sorted. The friendliest way to keep family money fair.</p>
            <div className="mt-10 flex w-full flex-col gap-3">
              <button className="btn btn-primary w-full" onClick={() => setStep('you')}>
                Start our family <ArrowRight size={19} />
              </button>
              <button className="btn btn-ghost w-full" onClick={() => setStep('join')}>
                I have an invite
              </button>
            </div>
          </div>
        )}

        {step === 'you' && (
          <div key="y" className="rise mt-4 flex flex-col">
            <Title kicker="Step 1 of 3" title="First up — you!" sub="Pick a name and a little buddy to represent you." />
            <MemberEditor
              initial={me || {}}
              submitLabel="Continue"
              onSave={(m) => {
                setMe(m)
                setStep('family')
              }}
            />
          </div>
        )}

        {step === 'family' && (
          <div key="f" className="rise mt-4 flex flex-1 flex-col">
            <Title kicker="Step 2 of 3" title="Who’s in the family?" sub="Add everyone you share money with. You can always add more later." />
            <form
              onSubmit={(e) => {
                e.preventDefault()
                addPerson(draft)
              }}
              className="flex gap-2"
            >
              <input className="field !bg-card shadow-card" placeholder="Name" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus enterKeyHint="done" maxLength={30} />
              <button className="btn btn-primary w-[52px] shrink-0 !px-0" disabled={!draft.trim()} aria-label="Add">
                <Plus size={22} strokeWidth={2.8} />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.filter((q) => !family.some((f) => f.name === q)).map((q) => (
                <button key={q} onClick={() => addPerson(q)} className="press rounded-full border border-line bg-card px-3.5 py-1.5 text-[15px] font-semibold text-ink-2">
                  + {q}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-2xl bg-accent-soft px-3 py-2.5">
                <Avatar member={me} size={40} />
                <span className="flex-1 font-semibold">{me?.name}</span>
                <span className="text-[13px] font-bold text-accent uppercase">You</span>
              </div>
              {family.map((m) => (
                <div key={m.id} className="pop flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5 shadow-card">
                  <button
                    onClick={() => setFamily((f) => f.map((x) => (x.id === m.id ? { ...x, emoji: pick(AVATARS), color: pick(TINTS) } : x)))}
                    aria-label="Shuffle avatar"
                    className="press rounded-full"
                  >
                    <Avatar member={m} size={40} />
                  </button>
                  <span className="flex-1 font-semibold">{m.name}</span>
                  <button className="press grid h-8 w-8 place-items-center rounded-full text-ink-3" onClick={() => setFamily((f) => f.filter((x) => x.id !== m.id))} aria-label={`Remove ${m.name}`}>
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
            {family.length > 0 && <p className="mt-2 text-center text-[13px] text-ink-3">Tip: tap an avatar to shuffle it</p>}
            <div className="flex-1" />
            <button className="btn btn-primary mt-6 w-full" onClick={() => setStep('crew')}>
              {family.length ? 'Continue' : 'Skip for now'} <ArrowRight size={19} />
            </button>
          </div>
        )}

        {step === 'crew' && (
          <div key="c" className="rise mt-4 flex flex-1 flex-col">
            <Title kicker="Step 3 of 3" title="Name your crew" sub="This shows up at the top of the app and on invites." />
            <input className="field !bg-card text-[18px] font-semibold shadow-card" placeholder={`${firstName(me?.name)}’s Family`} value={crew} onChange={(e) => setCrew(e.target.value)} maxLength={40} />
            <label className="mt-4 mb-1.5 block px-1 text-[13px] font-semibold tracking-wide text-ink-2 uppercase">Currency</label>
            <select className="field !bg-card shadow-card" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map(([c, n]) => (
                <option key={c} value={c}>
                  {c} — {n}
                </option>
              ))}
            </select>
            <div className="mt-8 flex justify-center -space-x-3">
              {[me, ...family].slice(0, 7).map((m, i) => (
                <Avatar key={i} member={m} size={52} className="pop ring-4 ring-bg" />
              ))}
            </div>
            <div className="flex-1" />
            <button className="btn btn-primary mt-8 w-full" onClick={finish}>
              Let’s go 🎉
            </button>
          </div>
        )}

        {step === 'join' && (
          <div key="j" className="rise mt-4 flex flex-1 flex-col">
            <Title title="Join your family" sub="Paste the invite link someone in your family shared with you." />
            <textarea
              className="field !bg-card font-mono text-[13px] shadow-card"
              rows={4}
              placeholder="https://…#join=…"
              value={joinText}
              onChange={(e) => setJoinText(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
            />
            <button className="mt-2 flex items-center gap-1.5 self-start px-1 text-[15px] font-semibold text-accent" onClick={paste}>
              <ClipboardPaste size={17} /> Paste from clipboard
            </button>
            {parsed && (
              <div className="pop mt-5 flex items-center gap-3 rounded-2xl bg-accent-soft p-4">
                <span className="text-[30px]">🏡</span>
                <div>
                  <div className="text-[13px] font-semibold text-ink-2">You’re joining</div>
                  <div className="title text-[19px] font-bold">{parsed.name || 'your family'}</div>
                </div>
              </div>
            )}
            {joinText && !parsed && <p className="mt-3 px-1 text-[14px] font-medium text-neg">That doesn’t look like an Evenly invite yet.</p>}
            <div className="flex-1" />
            <button className="btn btn-primary mt-8 w-full" disabled={!parsed || joining} onClick={join}>
              {joining ? 'Joining…' : 'Join family'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Title({ kicker, title, sub }) {
  return (
    <div className="mb-6">
      {kicker && <div className="mb-1 text-[13px] font-bold tracking-wide text-accent uppercase">{kicker}</div>}
      <h1 className="title text-[32px] leading-tight font-extrabold">{title}</h1>
      {sub && <p className="mt-1.5 text-[16px] leading-snug text-ink-2">{sub}</p>}
    </div>
  )
}
