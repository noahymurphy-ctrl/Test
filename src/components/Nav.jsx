import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const links = [
  { label: 'Performance', href: '#performance' },
  { label: 'Features', href: '#features' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Specs', href: '#specs' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLink = (href) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-nav' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-3 group"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <div className="w-8 h-8 rounded-full bg-[#107C10] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
                <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.637-4.316-7.048-7.902-10.524-3.584 3.476-9.779 8.887-7.898 10.524zm11.16-14.406c2.5 2.961 7.484 9.375 6.924 12.625A11.942 11.942 0 0 0 24 12.004a11.95 11.95 0 0 0-3.57-8.536s-.027-.023-.082-.059c-.295-.204-1.047-.479-2.083.172-.508.32-1.378 1.004-3.003 3.046zM3.654 3.41c-.056.036-.082.059-.082.059A11.95 11.95 0 0 0 0 12.004c0 2.854.998 5.473 2.652 7.533.017-3.058 4.686-9.04 7.228-12.351-1.624-2.042-2.494-2.726-3.003-3.046-1.036-.651-1.788-.376-2.083-.172-.001 0-.141-.143-.14-.558zM12 0C9.15 0 6.498.841 4.277 2.272c.076.164.23.421.537.621.482.311 1.414.685 2.912-.173.395-.224.906-.361 1.274.095L12 5.763l3-2.948c.368-.456.879-.319 1.274-.095 1.498.858 2.43.484 2.912.173.307-.2.461-.457.537-.621C17.502.841 14.85 0 12 0z" />
              </svg>
            </div>
            <span className="text-[#f0f0f0] font-semibold text-sm tracking-widest uppercase">
              Xbox Series X
            </span>
          </a>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleLink(link.href); }}
                className="text-[#8a8a8a] hover:text-[#f0f0f0] text-sm font-medium tracking-wide transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:block">
            <a
              href="#specs"
              onClick={(e) => { e.preventDefault(); handleLink('#specs'); }}
              className="px-5 py-2.5 bg-[#107C10] hover:bg-[#0d6a0d] text-white text-sm font-medium rounded-sm transition-colors duration-200 tracking-wide"
            >
              Explore Specs
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-[#8a8a8a] hover:text-[#f0f0f0] transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden glass-nav border-t border-white/5">
          <nav className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-5">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleLink(link.href); }}
                className="text-[#c0c0c0] hover:text-[#f0f0f0] text-base font-medium tracking-wide transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/5">
              <a
                href="#specs"
                onClick={(e) => { e.preventDefault(); handleLink('#specs'); }}
                className="inline-block px-5 py-2.5 bg-[#107C10] hover:bg-[#0d6a0d] text-white text-sm font-medium rounded-sm transition-colors duration-200 tracking-wide"
              >
                Explore Specs
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
