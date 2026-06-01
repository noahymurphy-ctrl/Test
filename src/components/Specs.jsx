import { useScrollReveal } from '../hooks/useScrollAnimation';

const steps = [
  {
    num: '01',
    icon: '💧',
    title: 'Boil the Water',
    body: "Bring 2 cups of water to a rolling boil. Don't settle for lukewarm — the noodles deserve better, and so do you.",
    tip: 'Pro tip: Add a pinch of salt to the water for extra depth.',
    bg: 'rgba(255,84,0,0.12)',
    border: 'rgba(255,84,0,0.25)',
  },
  {
    num: '02',
    icon: '🍜',
    title: 'Add Noodles & Broth',
    body: 'Drop in the noodles and the entire flavour packet. Stir and let it rip for 2 minutes. The protein-dense broth dissolves fast.',
    tip: 'Optional: crack a soft-boiled egg directly in at 90 seconds.',
    bg: 'rgba(255,184,0,0.09)',
    border: 'rgba(255,184,0,0.22)',
  },
  {
    num: '03',
    icon: '🔥',
    title: 'Devour',
    body: 'Pour into a bowl, top with your favourites, and consume. 40 grams of protein down. Goals being handled.',
    tip: 'Suggested toppings: nori, chashu, green onions, sesame seeds.',
    bg: 'rgba(255,26,75,0.08)',
    border: 'rgba(255,26,75,0.20)',
  },
];

export default function Specs() {
  const [ref, visible] = useScrollReveal(0.08);

  return (
    <section id="howto" style={{ padding: 'clamp(80px, 10vw, 130px) 24px', background: 'var(--bg)' }}>
      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div className={`section-label reveal ${visible ? 'show' : ''}`} style={{ marginBottom: 14 }}>
            How It Works
          </div>
          <h2 className={`reveal up d1 ${visible ? 'show' : ''}`} style={{
            fontSize: 'clamp(2rem, 4vw, 3.4rem)',
            fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1,
          }}>
            Three Steps to <span className="text-fire">Greatness.</span>
          </h2>
          <p className={`reveal up d2 ${visible ? 'show' : ''}`} style={{
            color: 'var(--text2)', fontSize: '1rem', marginTop: 16, maxWidth: 420, margin: '16px auto 0',
          }}>
            No chef's hat required. Just boiling water and 3 minutes of patience.
          </p>
        </div>

        <div className="section-divider" style={{ marginBottom: 64 }} />

        {/* Steps grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`step-card reveal up ${visible ? 'show' : ''}`}
              style={{
                transitionDelay: `${i * 0.12}s`,
                background: step.bg,
                borderColor: step.border,
              }}
            >
              <div className="step-bg-num">{step.num}</div>
              <div className="step-icon-wrap" style={{ background: step.bg, border: `1px solid ${step.border}` }}>
                {step.icon}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>
                {step.body}
              </p>
              <div style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                fontSize: '0.75rem',
                color: 'var(--text3)',
                lineHeight: 1.55,
              }}>
                💡 {step.tip}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className={`reveal up d4 ${visible ? 'show' : ''}`} style={{
          marginTop: 56,
          padding: '28px 36px',
          background: 'var(--card2)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Total prep time: under 3 minutes
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>
              That's shorter than your pre-workout playlist intro.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['3', 'min prep'], ['40g', 'protein'], ['0', 'excuses']].map(([num, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900 }} className="text-fire">{num}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
