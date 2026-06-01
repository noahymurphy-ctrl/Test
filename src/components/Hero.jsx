import { ArrowRight, Star } from 'lucide-react';

const TICKER_ITEMS = [
  '40g Protein Per Serving',
  'Ready in 3 Minutes',
  'No Artificial Preservatives',
  'High Protein · Low Guilt',
  '420 Calories',
  'Gluten-Free Option Available',
  'Real Ramen Taste',
  '40g Protein Per Serving',
  'Ready in 3 Minutes',
  'No Artificial Preservatives',
  'High Protein · Low Guilt',
  '420 Calories',
  'Gluten-Free Option Available',
  'Real Ramen Taste',
];

function BowlArt() {
  return (
    <div className="bowl-scene" style={{ margin: '0 auto' }}>
      <div className="bowl-glow" />
      <div className="bowl-rim">
        <div className="bowl-inside">
          <div className="broth-sheen" />
          <div className="noodle-ring r1" />
          <div className="noodle-ring r2" />
          <div className="noodle-ring r3" />
          <div className="top-egg" />
          <div className="top-nori" />
          <div className="top-chashu" />
          <div className="top-onion" />
        </div>
      </div>
      <div className="steam-group" style={{ top: '-30px' }}>
        <div className="steam-puff" />
        <div className="steam-puff" />
        <div className="steam-puff" />
        <div className="steam-puff" />
      </div>
      <div className="fl-badge b1">40g Protein 💪</div>
      <div className="fl-badge b2">3 Min Ready ⚡</div>
      <div className="fl-badge b3">Clean Label ✓</div>
    </div>
  );
}

export default function Hero() {
  const goto = (href) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      {/* Animated background blobs */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,84,0,0.12) 0%, transparent 65%)',
          top: '-100px', right: '-80px',
          animation: 'blob 14s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,184,0,0.08) 0%, transparent 65%)',
          bottom: '80px', left: '-60px',
          animation: 'blob 18s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute',
          width: 380, height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,26,75,0.07) 0%, transparent 65%)',
          top: '40%', left: '30%',
          animation: 'blob 22s ease-in-out infinite 4s',
        }} />
      </div>

      {/* Fine dot grid */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 1280, margin: '0 auto',
        padding: '100px 24px 60px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        gap: 48,
      }} className="hero-grid">

        {/* Left: Text */}
        <div style={{ animation: 'fade-up 0.9s cubic-bezier(.4,0,.2,1) both' }}>
          <div className="section-label" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 1, background: 'var(--orange)', display: 'inline-block' }} />
            The Protein Ramen Revolution
          </div>

          <h1 style={{
            fontSize: 'clamp(2.8rem, 6vw, 6.5rem)',
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            margin: '0 0 22px',
          }}>
            <span className="text-cream" style={{ display: 'block' }}>Fuel</span>
            <span className="text-cream" style={{ display: 'block' }}>Your</span>
            <span className="text-fire" style={{ display: 'block' }}>Obsession.</span>
          </h1>

          <p style={{
            color: 'var(--text2)',
            fontSize: 'clamp(1rem, 1.4vw, 1.15rem)',
            fontWeight: 400,
            lineHeight: 1.75,
            maxWidth: 460,
            marginBottom: 38,
          }}>
            PRORAMÉN packs <strong style={{ color: 'var(--text)', fontWeight: 700 }}>40 grams of clean protein</strong> into
            authentic, fire-kissed ramen that's ready in under 3 minutes.
            No compromises. All flavor.
          </p>

          {/* Mini stats row */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
            {[
              { val: '40g', label: 'Protein', color: 'var(--orange)' },
              { val: '420', label: 'Calories', color: 'var(--gold)' },
              { val: '3min', label: 'Ready', color: 'var(--red)' },
            ].map(({ val, label, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 900, color, lineHeight: 1 }}>
                  {val}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginTop: 2 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="#cta"
              onClick={(e) => { e.preventDefault(); goto('#cta'); }}
              className="btn-primary btn-shimmer"
            >
              <span>Shop Now</span>
              <ArrowRight size={15} />
            </a>
            <a
              href="#flavors"
              onClick={(e) => { e.preventDefault(); goto('#flavors'); }}
              className="btn-outline"
            >
              <span>See Flavors</span>
            </a>
          </div>

          {/* Social proof strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} fill="var(--gold)" stroke="none" />
              ))}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontWeight: 500 }}>
              4.9 / 5 from <strong style={{ color: 'var(--text2)', fontWeight: 700 }}>2,400+ athletes</strong>
            </span>
          </div>
        </div>

        {/* Right: Bowl art */}
        <div className="bowl-col" style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '40px 20px',
          animation: 'fade-up 0.9s cubic-bezier(.4,0,.2,1) 0.2s both',
        }}>
          <BowlArt />
        </div>
      </div>

      {/* Ticker band */}
      <div style={{
        position: 'relative', zIndex: 2,
        background: 'linear-gradient(135deg, var(--orange) 0%, #FF3000 50%, #FF5400 100%)',
        padding: '14px 0',
        overflow: 'hidden',
        marginTop: 'auto',
      }}>
        <div className="ticker-track">
          {TICKER_ITEMS.map((item, i) => (
            <span className="ticker-item" key={i}>
              {item}
              <span className="ticker-dot" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
