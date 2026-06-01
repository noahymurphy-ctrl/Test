import { ArrowRight, Zap, Package, Star } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';

const bundles = [
  {
    name: 'Starter Pack',
    servings: 10,
    price: '$34',
    per: '$3.40/serving',
    tag: null,
    color: 'var(--border)',
    accent: 'var(--text3)',
    flavors: '2 flavors included',
  },
  {
    name: 'Athlete Bundle',
    servings: 30,
    price: '$89',
    per: '$2.97/serving',
    tag: 'MOST POPULAR',
    color: 'var(--border-o)',
    accent: 'var(--orange)',
    flavors: 'All 4 flavors included',
  },
  {
    name: 'Beast Mode Box',
    servings: 60,
    price: '$159',
    per: '$2.65/serving',
    tag: 'BEST VALUE',
    color: 'rgba(255,184,0,0.28)',
    accent: 'var(--gold)',
    flavors: 'All 4 flavors + free shaker',
  },
];

export default function CTA() {
  const [ref, visible] = useScrollReveal(0.08);

  return (
    <section id="cta" style={{
      padding: 'clamp(80px, 10vw, 130px) 24px',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow BG */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,84,0,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Hero headline */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div className={`section-label reveal ${visible ? 'show' : ''}`} style={{ marginBottom: 14 }}>
            Limited Time
          </div>
          <h2 className={`reveal up d1 ${visible ? 'show' : ''}`} style={{
            fontSize: 'clamp(2.2rem, 5vw, 4.2rem)',
            fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05,
          }}>
            Start Fueling<br />
            <span className="text-fire">Like an Athlete.</span>
          </h2>
          <p className={`reveal up d2 ${visible ? 'show' : ''}`} style={{
            color: 'var(--text2)', fontSize: '1rem', marginTop: 16, maxWidth: 440, margin: '16px auto 0',
          }}>
            Free shipping on all orders. Ships in 1–2 business days. 30-day guarantee or your money back.
          </p>

          {/* Trust icons */}
          <div className={`reveal up d3 ${visible ? 'show' : ''}`} style={{
            display: 'flex', justifyContent: 'center', gap: 28, marginTop: 24, flexWrap: 'wrap',
          }}>
            {[
              { icon: '🚚', text: 'Free Shipping' },
              { icon: '🔄', text: '30-Day Returns' },
              { icon: '🧪', text: 'Lab Verified' },
              { icon: '⚡', text: 'Ships Fast' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.04em' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider" style={{ marginBottom: 64 }} />

        {/* Bundle cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 64 }}>
          {bundles.map((b, i) => (
            <div
              key={b.name}
              className={`reveal up ${visible ? 'show' : ''}`}
              style={{
                transitionDelay: `${i * 0.1}s`,
                background: 'var(--card)',
                border: `1px solid ${b.color}`,
                borderRadius: 18,
                padding: '32px 28px',
                position: 'relative',
                transition: 'transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 24px 60px rgba(0,0,0,0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {b.tag && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: b.accent === 'var(--gold)' ? 'var(--gold)' : 'var(--orange)',
                  color: b.accent === 'var(--gold)' ? '#1A0800' : '#fff',
                  fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.14em',
                  padding: '4px 14px', borderRadius: 100, textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>
                  {b.tag}
                </div>
              )}

              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: b.accent, marginBottom: 8 }}>
                {b.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '2.6rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{b.price}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 20 }}>{b.per}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {[
                  `${b.servings} servings`,
                  `${b.servings * 40}g total protein`,
                  b.flavors,
                ].map((feat) => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: b.accent === 'var(--gold)'
                    ? 'linear-gradient(135deg, var(--gold), #FF8C00)'
                    : 'linear-gradient(135deg, var(--orange), #FF7833)',
                }}
              >
                <span>Order Now</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom guarantee */}
        <div className={`reveal up d5 ${visible ? 'show' : ''}`} style={{
          textAlign: 'center',
          padding: '32px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          maxWidth: 640,
          margin: '0 auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 12 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="var(--gold)" stroke="none" />)}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
            30-Day Money-Back Guarantee
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text3)', lineHeight: 1.7 }}>
            If PRORAMÉN doesn't become your new favourite meal — for any reason — we'll refund you in full. No questions, no forms, no stress.
          </div>
        </div>
      </div>
    </section>
  );
}
