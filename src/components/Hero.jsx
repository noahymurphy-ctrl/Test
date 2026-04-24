import { ArrowDown, ArrowRight } from 'lucide-react';

const METRICS = [
  { value: '12',  unit: 'TFLOPS', label: 'GPU Performance'  },
  { value: '4K',  unit: 'Native', label: 'Resolution'       },
  { value: '120', unit: 'FPS',    label: 'Max Frame Rate'   },
  { value: '1TB', unit: 'NVMe',   label: 'Custom SSD'       },
];

function scrollTo(href) {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#080808]">

      {/* ── Background radial glow ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 105%, rgba(16,124,16,0.09) 0%, transparent 65%),
            radial-gradient(ellipse 40% 30% at 75% 15%, rgba(16,124,16,0.04) 0%, transparent 55%)
          `,
        }}
      />

      {/* ── Subtle grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* ── Console silhouette (centered, very faint) ── */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none anim-fade-in"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 300 520"
          className="w-44 sm:w-52 md:w-60 lg:w-72 opacity-[0.042]"
          fill="none"
        >
          {/* Body */}
          <rect x="28" y="8"  width="244" height="504" rx="30" fill="white" />
          <rect x="44" y="24" width="212" height="472" rx="22" fill="#080808" />
          {/* Vent lines */}
          {Array.from({ length: 18 }, (_, i) => (
            <line
              key={i}
              x1="58"  y1={44 + i * 10}
              x2="242" y2={44 + i * 10}
              stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.55"
            />
          ))}
          {/* Xbox button */}
          <circle cx="150" cy="330" r="46" fill="white" opacity="0.88" />
          <circle cx="150" cy="330" r="36" fill="#080808" />
          {/* Disc slot */}
          <rect x="58"  y="446" width="184" height="4" rx="2" fill="white" opacity="0.45" />
          {/* USB port */}
          <rect x="58"  y="466" width="24"  height="9" rx="2.5" fill="white" opacity="0.35" />
          {/* Power indicator */}
          <circle cx="150" cy="496" r="7" fill="white" opacity="0.28" />
        </svg>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 container flex-1 flex flex-col justify-center pt-28 pb-12">
        <div className="max-w-[780px]">

          {/* Overline */}
          <p className="label anim-fade-up mb-7">
            The Most Powerful Console Ever Built
          </p>

          {/* Headline */}
          <h1
            className="anim-fade-up-1 font-black leading-none tracking-tight"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)', letterSpacing: '-0.04em' }}
          >
            <span className="text-gradient block">Power</span>
            <span className="text-gradient block">Your</span>
            <span className="text-gradient-green block">Dreams.</span>
          </h1>

          {/* Body */}
          <p
            className="anim-fade-up-2 mt-8 text-[#6A6A6A] font-light leading-relaxed max-w-[520px]"
            style={{ fontSize: 'clamp(1rem, 1.4vw, 1.1rem)' }}
          >
            Xbox Series X redefines what a console can be — true 4K visuals,
            up to 120 frames per second, near-instant load times, and hardware
            ray tracing, all in one monolithic tower.
          </p>

          {/* CTAs */}
          <div className="anim-fade-up-3 mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#performance"
              onClick={(e) => { e.preventDefault(); scrollTo('#performance'); }}
              className="btn-primary"
            >
              Discover Performance
              <ArrowRight size={14} strokeWidth={2} />
            </a>
            <a
              href="#specs"
              onClick={(e) => { e.preventDefault(); scrollTo('#specs'); }}
              className="text-[#505050] hover:text-[#EFEFEF] text-[12px] font-medium tracking-[0.1em] uppercase transition-colors duration-200 flex items-center gap-2"
            >
              Full Specifications
              <span className="text-[#107C10]">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Metrics strip ── */}
      <div className="relative z-10 border-t border-white/[0.055] anim-fade-up-4">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {METRICS.map((m, i) => (
              <div
                key={m.label}
                className={[
                  'py-7',
                  i < METRICS.length - 1 ? 'border-r border-white/[0.055]' : '',
                  i > 0 ? 'pl-6 lg:pl-10' : '',
                ].join(' ')}
              >
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span
                    className="stat-num text-[#EFEFEF] font-black"
                    style={{ fontSize: 'clamp(1.375rem, 2.2vw, 1.875rem)' }}
                  >
                    {m.value}
                  </span>
                  <span className="text-[#107C10] font-bold text-xs tracking-wider uppercase">
                    {m.unit}
                  </span>
                </div>
                <p className="text-[#404040] text-[11px] font-medium tracking-[0.1em] uppercase">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scroll cue ── */}
      <div
        className="absolute bottom-36 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 pointer-events-none"
        aria-hidden="true"
      >
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-[rgba(16,124,16,0.5)]" />
        <ArrowDown size={13} className="text-[#107C10] anim-scroll opacity-50" strokeWidth={1.5} />
      </div>
    </section>
  );
}
