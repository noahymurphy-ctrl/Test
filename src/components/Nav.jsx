import { useState, useEffect } from 'react';
import { Menu, X, Flame } from 'lucide-react';

const links = [
  { label: 'Macros', href: '#macros' },
  { label: 'Flavors', href: '#flavors' },
  { label: 'Ingredients', href: '#ingredients' },
  { label: 'Reviews', href: '#reviews' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const goto = (href) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        transition: 'all 0.5s cubic-bezier(.4,0,.2,1)',
        background: scrolled ? 'rgba(9,7,5,0.82)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,84,0,0.08)' : '1px solid transparent',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>

          {/* Logo */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #FF5400, #FF7833)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(255,84,0,0.4)',
              flexShrink: 0,
            }}>
              <Flame size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: '1.05rem',
              fontWeight: 900,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #FF5400 0%, #FFB800 60%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Proramén
            </span>
          </a>

          {/* Desktop Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '36px' }} className="hidden-mobile">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => { e.preventDefault(); goto(l.href); }}
                style={{
                  color: 'var(--text2)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--text)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text2)'}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <a
            href="#cta"
            onClick={(e) => { e.preventDefault(); goto('#cta'); }}
            className="btn-primary btn-shimmer hidden-mobile"
            style={{ padding: '10px 24px', fontSize: '0.78rem' }}
          >
            <span>Order Now</span>
          </a>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text2)', padding: 4, display: 'none',
            }}
            className="show-mobile"
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          background: 'rgba(9,7,5,0.96)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
        }}>
          <nav style={{
            maxWidth: 1280, margin: '0 auto',
            padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '20px',
          }}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => { e.preventDefault(); goto(l.href); }}
                style={{
                  color: 'var(--text2)', textDecoration: 'none',
                  fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#cta"
              onClick={(e) => { e.preventDefault(); goto('#cta'); }}
              className="btn-primary"
              style={{ alignSelf: 'flex-start', padding: '12px 26px' }}
            >
              <span>Order Now</span>
            </a>
          </nav>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}
