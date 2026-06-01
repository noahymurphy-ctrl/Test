import { Flame, Camera, AtSign, Play } from 'lucide-react';

const sections = [
  { heading: 'Product', links: ['Flavors', 'Bundles', 'Ingredients', 'Nutrition Facts', 'FAQs'] },
  { heading: 'Company', links: ['About Us', 'Our Mission', 'Sustainability', 'Press', 'Careers'] },
  { heading: 'Support', links: ['Track Order', 'Returns', 'Shipping', 'Contact', 'Accessibility'] },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
      {/* Links section */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) 24px 40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 48,
          marginBottom: 56,
        }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'linear-gradient(135deg, #FF5400, #FF7833)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(255,84,0,0.35)',
              }}>
                <Flame size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{
                fontWeight: 900, fontSize: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #FF5400, #FFB800)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Proramén
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text3)', lineHeight: 1.7, maxWidth: 200, marginBottom: 20 }}>
              High-protein instant ramen engineered for athletes who refuse to sacrifice flavor.
            </p>
            {/* Socials */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { Icon: Camera, label: 'Instagram' },
                { Icon: AtSign, label: 'Twitter' },
                { Icon: Play, label: 'YouTube' },
              ].map(({ Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: 'var(--card)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text3)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,84,0,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255,84,0,0.3)';
                    e.currentTarget.style.color = 'var(--orange)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text3)';
                  }}
                >
                  <Icon size={15} strokeWidth={1.8} />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {sections.map(({ heading, links }) => (
            <div key={heading}>
              <h4 style={{
                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 18,
              }}>
                {heading}
              </h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: '0.82rem', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--text2)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--text3)'}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="section-divider" style={{ marginBottom: 24 }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text3)', margin: 0 }}>
            © {new Date().getFullYear()} PRORAMÉN Inc. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Use', 'Cookie Policy'].map((item) => (
              <a
                key={item}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ fontSize: '0.72rem', color: 'var(--text3)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--text2)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text3)'}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
