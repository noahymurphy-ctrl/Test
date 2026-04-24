import { ArrowUpRight } from 'lucide-react';

const sections = [
  {
    heading: 'Console',
    links: ['Xbox Series X', 'Xbox Series S', 'Xbox One', 'Accessories', 'Controller'],
  },
  {
    heading: 'Gaming',
    links: ['Xbox Game Pass', 'Xbox Live Gold', 'Cloud Gaming', 'EA Play', 'PC Game Pass'],
  },
  {
    heading: 'Community',
    links: ['Xbox Wire', 'Xbox Support', 'Xbox Ambassadors', 'Insider Program', 'Feedback'],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05]">
      {/* CTA band */}
      <div
        className="relative overflow-hidden py-20 lg:py-28"
        style={{
          background: `
            radial-gradient(ellipse 70% 80% at 50% 50%, rgba(16,124,16,0.07) 0%, transparent 70%),
            #080808
          `,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <div className="mb-5">
            <span className="section-label">Ready to Experience It</span>
          </div>
          <h2
            className="font-black text-gradient leading-none tracking-tight mb-8"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.04em' }}
          >
            The Next Level
            <br />
            Awaits.
          </h2>
          <p className="text-[#5a5a5a] font-light mb-10 max-w-lg mx-auto" style={{ fontSize: '1rem' }}>
            Xbox Series X. True 4K. Up to 120fps. The world's fastest SSD.
            This is what next-generation feels like.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#"
              className="flex items-center gap-2 px-7 py-3.5 bg-[#107C10] hover:bg-[#0d6a0d] text-white text-sm font-semibold rounded-sm tracking-wide transition-colors duration-200"
            >
              Shop Xbox Series X
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-7 py-3.5 glass-card hover:border-[rgba(16,124,16,0.3)] text-[#c0c0c0] hover:text-[#f0f0f0] text-sm font-medium rounded-sm tracking-wide transition-all duration-200"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Compare Consoles
            </a>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-full bg-[#107C10] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
                  <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.637-4.316-7.048-7.902-10.524-3.584 3.476-9.779 8.887-7.898 10.524zm11.16-14.406c2.5 2.961 7.484 9.375 6.924 12.625A11.942 11.942 0 0 0 24 12.004a11.95 11.95 0 0 0-3.57-8.536s-.027-.023-.082-.059c-.295-.204-1.047-.479-2.083.172-.508.32-1.378 1.004-3.003 3.046zM3.654 3.41c-.056.036-.082.059-.082.059A11.95 11.95 0 0 0 0 12.004c0 2.854.998 5.473 2.652 7.533.017-3.058 4.686-9.04 7.228-12.351-1.624-2.042-2.494-2.726-3.003-3.046-1.036-.651-1.788-.376-2.083-.172-.001 0-.141-.143-.14-.558zM12 0C9.15 0 6.498.841 4.277 2.272c.076.164.23.421.537.621.482.311 1.414.685 2.912-.173.395-.224.906-.361 1.274.095L12 5.763l3-2.948c.368-.456.879-.319 1.274-.095 1.498.858 2.43.484 2.912.173.307-.2.461-.457.537-.621C17.502.841 14.85 0 12 0z" />
                </svg>
              </div>
              <span className="text-[#f0f0f0] font-semibold text-xs tracking-widest uppercase">Xbox</span>
            </div>
            <p className="text-[#4a4a4a] text-xs leading-relaxed font-light">
              The most powerful gaming console ever built. Experience games like never before.
            </p>
          </div>

          {/* Link sections */}
          {sections.map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="section-label mb-5">{heading}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[#4a4a4a] hover:text-[#a0a0a0] text-xs font-light tracking-wide transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="divider mb-8" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[#3a3a3a] text-xs font-light">
            © {new Date().getFullYear()} Microsoft Corporation. Xbox is a trademark of Microsoft.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Accessibility', 'Cookies'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[#3a3a3a] hover:text-[#6a6a6a] text-xs font-light transition-colors duration-200"
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
