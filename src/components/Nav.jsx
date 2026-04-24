import { useState, useEffect } from 'react';
import { Menu, X, Gamepad2 } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Performance', href: '#performance' },
  { label: 'Features',    href: '#features'    },
  { label: 'Capabilities',href: '#capabilities' },
  { label: 'Compare',     href: '#compare'      },
  { label: 'Specs',       href: '#specs'        },
];

function scrollTo(href) {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLink = (e, href) => {
    e.preventDefault();
    setOpen(false);
    scrollTo(href);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav' : 'bg-transparent'
      }`}
    >
      <div className="container flex items-center justify-between h-16">

        {/* ── Logo ── */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex items-center gap-2.5 group"
          aria-label="Xbox Series X — home"
        >
          <div className="w-7 h-7 rounded-[4px] bg-[#107C10] flex items-center justify-center flex-shrink-0">
            <Gamepad2 size={14} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-[#EFEFEF] font-semibold text-[13px] tracking-[0.12em] uppercase">
            Xbox <span className="text-[#404040]">Series X</span>
          </span>
        </a>

        {/* ── Desktop links ── */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => handleLink(e, l.href)}
              className="text-[#555] hover:text-[#EFEFEF] text-[12px] font-medium tracking-[0.12em] uppercase transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* ── Desktop CTA ── */}
        <a
          href="#specs"
          onClick={(e) => handleLink(e, '#specs')}
          className="btn-primary hidden md:inline-flex"
          style={{ padding: '9px 20px', fontSize: '12px' }}
        >
          Full Specs
        </a>

        {/* ── Mobile toggle ── */}
        <button
          className="md:hidden text-[#7A7A7A] hover:text-[#EFEFEF] transition-colors p-1"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="md:hidden glass-nav border-t border-white/[0.04]">
          <nav className="container py-8 flex flex-col gap-5" aria-label="Mobile navigation">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleLink(e, l.href)}
                className="text-[#7A7A7A] hover:text-[#EFEFEF] text-sm font-medium tracking-[0.1em] uppercase transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-5 border-t border-white/[0.04]">
              <a
                href="#specs"
                onClick={(e) => handleLink(e, '#specs')}
                className="btn-primary"
              >
                Full Specs
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
