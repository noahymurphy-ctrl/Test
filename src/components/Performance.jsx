import { useScrollReveal, useCounter } from '../hooks/useScrollAnimation';

const stats = [
  { val: 40, suffix: 'g', label: 'Protein', sub: 'per serving — fuels muscle repair & growth', color: 'c-orange' },
  { val: 420, suffix: '', label: 'Calories', sub: 'balanced macros, not empty carbs', color: 'c-gold' },
  { val: 28, suffix: 'g', label: 'Carbs', sub: 'complex carbohydrates for sustained energy', color: 'c-red' },
  { val: 3, suffix: 'min', label: 'Ready In', sub: "fastest high-protein meal you'll ever make", color: 'c-pink' },
];

const colorMap = {
  'c-orange': 'linear-gradient(135deg,#FF5400,#FF9A3C)',
  'c-gold':   'linear-gradient(135deg,#FFB800,#FFDD66)',
  'c-red':    'linear-gradient(135deg,#FF1A4B,#FF6E8A)',
  'c-pink':   'linear-gradient(135deg,#FF3D8B,#FF7BB5)',
};

function StatCard({ val, suffix, label, sub, color, trigger, delay }) {
  const count = useCounter(val, 1600, trigger);
  return (
    <div className={`stat-card ${color} reveal scale`} style={{ transitionDelay: delay }}>
      <div style={{ fontSize: 'clamp(2.6rem, 4vw, 3.8rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 6 }}>
        <span style={{ background: colorMap[color], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {count}{suffix}
        </span>
      </div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text3)', lineHeight: 1.55 }}>{sub}</div>
    </div>
  );
}

export default function Performance() {
  const [ref, visible] = useScrollReveal(0.15);

  return (
    <section id="macros" style={{ padding: 'clamp(80px, 10vw, 130px) 24px', background: 'var(--bg2)' }}>
      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className={`section-label reveal ${visible ? 'show' : ''}`} style={{ marginBottom: 14 }}>
            Nutrition Profile
          </div>
          <h2 className={`reveal up d1 ${visible ? 'show' : ''}`} style={{
            fontSize: 'clamp(2rem, 4vw, 3.4rem)',
            fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1,
          }}>
            Numbers That <span className="text-fire">Actually Matter</span>
          </h2>
          <p className={`reveal up d2 ${visible ? 'show' : ''}`} style={{
            color: 'var(--text2)', fontSize: '1rem', marginTop: 16, maxWidth: 520, margin: '16px auto 0',
          }}>
            No hidden sugars, no filler carbs. Every gram is intentional.
          </p>
        </div>

        <div className="section-divider" style={{ marginBottom: 56 }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} trigger={visible} delay={`${i * 0.1}s`} />
          ))}
        </div>

        <div className={`reveal up d4 ${visible ? 'show' : ''}`} style={{
          marginTop: 48,
          padding: '28px 36px',
          background: 'linear-gradient(135deg, rgba(255,84,0,0.07) 0%, rgba(255,184,0,0.04) 100%)',
          border: '1px solid var(--border-o)',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Protein-to-Calorie Ratio: 9.5%
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text3)', lineHeight: 1.6 }}>
              That's 2–3× higher than standard instant ramen. PRORAMÉN isn't a diet food — it's engineered performance nutrition disguised as the best bowl of your life.
            </div>
          </div>
          <div style={{ flexShrink: 0, fontSize: '2.8rem', fontWeight: 900 }} className="text-fire">9.5%</div>
        </div>
      </div>
    </section>
  );
}
