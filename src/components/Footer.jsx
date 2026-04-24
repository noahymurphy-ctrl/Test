import { ArrowUpRight, Gamepad2 } from 'lucide-react';

const LINKS = [
  {
    heading: 'Console',
    items:   ['Xbox Series X', 'Xbox Series S', 'Xbox One', 'Accessories', 'Controller'],
  },
  {
    heading: 'Gaming',
    items:   ['Xbox Game Pass', 'Xbox Live Gold', 'Cloud Gaming', 'EA Play', 'PC Game Pass'],
  },
  {
    heading: 'Community',
    items:   ['Xbox Wire', 'Xbox Support', 'Insider Program', 'Xbox Ambassadors', 'Feedback'],
  },
];

function scrollTo(href) {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Footer() {
  return (
    <footer className="bg-[#080808] border-t border-white/[0.04]">

      {/* ── CTA band ── */}
      <div
        className="relative overflow-hidden section-pad"
        style={{
          background: `
            radial-gradient(ellipse 60% 70% at 50% 50%, rgba(16,124,16,0.06) 0%, transparent 70%),
            #080808
          `,
        }}
      >
        <div className="container text-center">
          <p className="label mb-5">Ready to Experience It</p>

          <h2
            className="font-black text-gradient leading-none tracking-tight mb-8"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.04em' }}
          >
            The Next Level<br />Awaits.
          </h2>

          <p className="text-[#4A4A4A] font-light mb-10 max-w-md mx-auto text-[0.9375rem] leading-relaxed">
            Xbox Series X. True 4K. Up to 120 fps. The world's fastest console SSD.
            This is what next-generation feels like.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a href="#" className="btn-primary">
              Shop Xbox Series X
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </a>
            <a
              href="#compare"
              onClick={(e) => { e.preventDefault(); scrollTo('#compare'); }}
              className="btn-ghost"
            >
              Compare Consoles
            </a>
          </div>
        </div>
      </div>

      {/* ── Links ── */}
      <div className="border-t border-white/[0.04]">
        <div className="container py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-6 h-6 rounded-[4px] bg-[#107C10] flex items-center justify-center flex-shrink-0">
                  <Gamepad2 size={12} className="text-white" strokeWidth={2} />
                </div>
                <span className="text-[#EFEFEF] font-semibold text-[12px] tracking-[0.12em] uppercase">Xbox</span>
              </div>
              <p className="text-[#333] text-[12px] leading-relaxed font-light max-w-[200px]">
                The most powerful gaming console ever built. Experience games as they were meant to be played.
              </p>
            </div>

            {/* Link columns */}
            {LINKS.map(({ heading, items }) => (
              <div key={heading}>
                <h4 className="label text-[10px] mb-5">{heading}</h4>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-[#333] hover:text-[#888] text-[12px] font-light tracking-wide transition-colors duration-200"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="rule mb-7" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[#2C2C2C] text-[11px] font-light">
              © {new Date().getFullYear()} Microsoft Corporation. Xbox is a registered trademark of Microsoft.
            </p>
            <div className="flex flex-wrap gap-5">
              {['Privacy', 'Terms', 'Accessibility', 'Cookies'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-[#2C2C2C] hover:text-[#555] text-[11px] font-light transition-colors duration-200"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}
