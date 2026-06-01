import { Star } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';

const reviews = [
  {
    name: 'Marcus T.',
    handle: '@marcusfits',
    avatar: 'MT',
    avatarBg: 'linear-gradient(135deg, #FF5400, #FF8C42)',
    text: "I've tried every high-protein meal out there. PRORAMÉN is the only one that doesn't taste like cardboard punishment. Ghost Pepper Fire hits different — and the macros are insane.",
    rating: 5,
    tag: 'Bodybuilder · 4 years',
  },
  {
    name: 'Jordan K.',
    handle: '@coachkrause',
    avatar: 'JK',
    avatarBg: 'linear-gradient(135deg, #FFB800, #FF5400)',
    text: "My athletes needed a fast, real-food option between sessions. PRORAMÉN solved that. The Spicy Miso flavour is their go-to. Legit 40g protein — we lab-tested it ourselves.",
    rating: 5,
    tag: 'Sports Nutritionist',
  },
  {
    name: 'Priya M.',
    handle: '@runningwithpriya',
    avatar: 'PM',
    avatarBg: 'linear-gradient(135deg, #FF3D8B, #FF6E8A)',
    text: "Clean label, no soy, ready in 3 minutes. As a runner I need fast recovery fuel. Tonkotsu Gold post-run has become my ritual. My gut is happy. My muscles are happier.",
    rating: 5,
    tag: 'Ultra Runner · Boston Qualifier',
  },
];

const aggregate = { score: '4.9', count: '2,400+', text: 'Verified athletes' };

export default function Reviews() {
  const [ref, visible] = useScrollReveal(0.08);

  return (
    <section id="reviews" style={{ padding: 'clamp(80px, 10vw, 130px) 24px', background: 'var(--bg2)' }}>
      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className={`section-label reveal ${visible ? 'show' : ''}`} style={{ marginBottom: 14 }}>
            Real Athletes
          </div>
          <h2 className={`reveal up d1 ${visible ? 'show' : ''}`} style={{
            fontSize: 'clamp(2rem, 4vw, 3.4rem)',
            fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1,
          }}>
            They Tried It. <span className="text-fire">They're Obsessed.</span>
          </h2>

          {/* Aggregate */}
          <div className={`reveal up d2 ${visible ? 'show' : ''}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 20,
            padding: '12px 24px',
            background: 'rgba(255,184,0,0.07)',
            border: '1px solid rgba(255,184,0,0.18)',
            borderRadius: 100,
          }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="var(--gold)" stroke="none" />
              ))}
            </div>
            <span style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '1.1rem' }}>{aggregate.score}</span>
            <span style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>from {aggregate.count} {aggregate.text}</span>
          </div>
        </div>

        <div className="section-divider" style={{ marginBottom: 56 }} />

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {reviews.map((r, i) => (
            <div
              key={r.name}
              className={`review-card reveal up ${visible ? 'show' : ''}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              {/* Stars */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
                {[...Array(r.rating)].map((_, j) => (
                  <Star key={j} size={13} fill="var(--gold)" stroke="none" />
                ))}
              </div>

              <p style={{ fontSize: '0.92rem', color: 'var(--text2)', lineHeight: 1.75, marginBottom: 24 }}>
                "{r.text}"
              </p>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar-circle" style={{ background: r.avatarBg }}>
                  {r.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{r.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 1 }}>{r.tag}</div>
                </div>
                <div style={{
                  marginLeft: 'auto',
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                  color: 'var(--orange)', background: 'rgba(255,84,0,0.1)',
                  border: '1px solid rgba(255,84,0,0.18)', borderRadius: 100,
                  padding: '3px 9px',
                }}>
                  VERIFIED
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
