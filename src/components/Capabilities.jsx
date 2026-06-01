import { useScrollReveal } from '../hooks/useScrollAnimation';

const ingredients = [
  { icon: '🐟', name: 'Whey Protein Isolate', note: 'Primary protein source' },
  { icon: '🌾', name: 'Rice Noodles', note: 'Gluten-free option' },
  { icon: '🧅', name: 'Dehydrated Shallots', note: 'Real aromatics' },
  { icon: '🧄', name: 'Roasted Garlic', note: 'Slow-roasted' },
  { icon: '🫚', name: 'Sesame Oil', note: 'Cold-pressed' },
  { icon: '🧂', name: 'Sea Salt', note: 'Mineral-rich' },
  { icon: '🌿', name: 'Dried Scallions', note: 'No artificial flavor' },
  { icon: '🦴', name: 'Bone Broth Powder', note: 'Collagen-rich' },
  { icon: '🍄', name: 'Shiitake Powder', note: 'Umami depth' },
  { icon: '🌶️', name: 'Chili Extract', note: 'Heat on demand' },
  { icon: '🫛', name: 'Pea Protein', note: 'Boosts protein total' },
  { icon: '🌊', name: 'Kombu Extract', note: 'Natural MSG alternative' },
];

const badges = [
  { text: 'No Artificial Flavors', color: 'var(--orange)' },
  { text: 'No Added MSG', color: 'var(--gold)' },
  { text: 'Gluten-Free Option', color: 'var(--red)' },
  { text: 'Hormone-Free', color: 'var(--pink)' },
  { text: 'Non-GMO', color: '#4ADE80' },
  { text: 'Soy-Free', color: '#60A5FA' },
];

export default function Capabilities() {
  const [ref, visible] = useScrollReveal(0.08);

  return (
    <section id="ingredients" style={{ padding: 'clamp(80px, 10vw, 130px) 24px', background: 'var(--bg2)' }}>
      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto' }}>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 80,
          alignItems: 'start',
        }}>
          {/* Left: text */}
          <div>
            <div className={`section-label reveal ${visible ? 'show' : ''}`} style={{ marginBottom: 14 }}>
              What's Inside
            </div>
            <h2 className={`reveal up d1 ${visible ? 'show' : ''}`} style={{
              fontSize: 'clamp(2rem, 4vw, 3.4rem)',
              fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 20px', lineHeight: 1.1,
            }}>
              Real Ingredients.<br />
              <span className="text-fire">Real Results.</span>
            </h2>
            <p className={`reveal up d2 ${visible ? 'show' : ''}`} style={{
              color: 'var(--text2)', fontSize: '1rem', lineHeight: 1.75, marginBottom: 32,
            }}>
              We list everything on the label. No filler, no fluff, no fine print tricks.
              If it's in the bowl, you'll see it right here.
            </p>

            {/* Clean label badges */}
            <div className={`reveal up d3 ${visible ? 'show' : ''}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {badges.map(({ text, color }) => (
                <div key={text} style={{
                  padding: '7px 14px',
                  border: `1px solid ${color}44`,
                  borderRadius: 100,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color,
                  background: `${color}11`,
                }}>
                  {text}
                </div>
              ))}
            </div>

            {/* Callout */}
            <div className={`reveal up d4 ${visible ? 'show' : ''}`} style={{
              marginTop: 40,
              padding: '20px 22px',
              background: 'rgba(255,84,0,0.05)',
              border: '1px solid var(--border-o)',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 6 }}>
                Third-Party Tested
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text3)', lineHeight: 1.6 }}>
                Every batch is lab-verified for protein content, heavy metals, and purity before it ships. NSF Certified for Sport pending.
              </div>
            </div>
          </div>

          {/* Right: ingredient chips */}
          <div className={`reveal right d1 ${visible ? 'show' : ''}`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ingredients.map((ing, i) => (
                <div
                  key={ing.name}
                  className="ing-chip"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{ing.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)', lineHeight: 1.2 }}>{ing.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{ing.note}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Full panel note */}
            <div style={{ marginTop: 28, padding: '14px 18px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', lineHeight: 1.6 }}>
                Full ingredients panel available on every package. Flavor variants may vary slightly — all contain ≥40g protein.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
