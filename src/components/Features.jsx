import { useScrollReveal } from '../hooks/useScrollAnimation';

const flavors = [
  {
    emoji: '🌶️',
    name: 'Ghost Pepper Fire',
    tagline: 'For those who dare',
    description: 'Scorching ghost pepper broth with a deep smoky base. This one bites back.',
    heat: 5,
    badge: 'ULTRA SPICY',
    badgeColor: 'var(--red)',
    bg: 'linear-gradient(160deg, #2E0808 0%, #1A0404 100%)',
    accent: 'var(--red)',
    pips: 'on-red',
  },
  {
    emoji: '🍜',
    name: 'Spicy Miso',
    tagline: 'Bold & balanced',
    description: 'Fermented miso paste, chili oil, and a clean umami depth that keeps you coming back.',
    heat: 3,
    badge: 'BEST SELLER',
    badgeColor: 'var(--orange)',
    bg: 'linear-gradient(160deg, #2A1200 0%, #180900 100%)',
    accent: 'var(--orange)',
    pips: 'on-orange',
  },
  {
    emoji: '🥩',
    name: 'Tonkotsu Gold',
    tagline: 'Rich & creamy',
    description: 'Slow-simmered pork bone richness, silky broth, and a whisper of roasted garlic.',
    heat: 1,
    badge: 'NEW',
    badgeColor: 'var(--gold)',
    bg: 'linear-gradient(160deg, #1E1100 0%, #110A00 100%)',
    accent: 'var(--gold)',
    pips: 'on-gold',
  },
  {
    emoji: '🧄',
    name: 'Black Garlic',
    tagline: 'Dark & complex',
    description: 'Aged black garlic delivers caramel-like sweetness with an earthy, intense finish.',
    heat: 2,
    badge: 'FAN FAVORITE',
    badgeColor: 'var(--pink)',
    bg: 'linear-gradient(160deg, #1A0820 0%, #0E0412 100%)',
    accent: 'var(--pink)',
    pips: 'on-pink',
  },
];

export default function Features() {
  const [ref, visible] = useScrollReveal(0.08);

  return (
    <section id="flavors" style={{ padding: 'clamp(80px, 10vw, 130px) 24px', background: 'var(--bg)' }}>
      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 64 }}>
          <div className={`section-label reveal ${visible ? 'show' : ''}`} style={{ marginBottom: 14 }}>
            Flavor Lineup
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <h2 className={`reveal up d1 ${visible ? 'show' : ''}`} style={{
              fontSize: 'clamp(2rem, 4vw, 3.4rem)',
              fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1,
            }}>
              Choose Your <span className="text-fire">Flavor.</span>
            </h2>
            <p className={`reveal up d2 ${visible ? 'show' : ''}`} style={{
              color: 'var(--text3)', fontSize: '0.9rem', maxWidth: 320, marginBottom: 4,
            }}>
              Four distinct personalities. All with 40g protein. Zero compromise on taste.
            </p>
          </div>
        </div>

        <div className="section-divider" style={{ marginBottom: 56 }} />

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {flavors.map((f, i) => (
            <div
              key={f.name}
              className={`flavor-card reveal up ${visible ? 'show' : ''}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              {/* Card hero */}
              <div className="flavor-hero" style={{ background: f.bg }}>
                {/* Badge */}
                <div style={{
                  position: 'absolute', top: 14, left: 14,
                  background: f.badgeColor,
                  color: f.badgeColor === 'var(--gold)' ? '#1A0800' : '#fff',
                  fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12em',
                  padding: '4px 10px', borderRadius: 100,
                  textTransform: 'uppercase',
                }}>
                  {f.badge}
                </div>
                {/* Glow circle */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(circle at 50% 60%, ${f.accent}22 0%, transparent 65%)`,
                }} />
                <div className="flavor-emoji">{f.emoji}</div>
              </div>

              {/* Card body */}
              <div style={{ padding: '24px 22px 26px' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
                  {f.tagline}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
                  {f.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text3)', lineHeight: 1.6, marginBottom: 18 }}>
                  {f.description}
                </p>

                {/* Heat level */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)' }}>Heat</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((pip) => (
                      <div
                        key={pip}
                        className={`heat-pip ${pip <= f.heat ? f.pips : ''}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Protein callout */}
                <div style={{
                  marginTop: 18,
                  padding: '10px 14px',
                  background: 'rgba(255,84,0,0.06)',
                  border: '1px solid rgba(255,84,0,0.14)',
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 500 }}>Protein per serving</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--orange)' }}>40g</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
