import { ArrowDown, Zap, Monitor, Cpu } from 'lucide-react';

const pillars = [
  { icon: Cpu, label: '12 Teraflops' },
  { icon: Monitor, label: 'True 4K / 120fps' },
  { icon: Zap, label: '2.4 GB/s NVMe SSD' },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-end overflow-hidden">
      {/* Background layers */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 100%, rgba(16,124,16,0.09) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(16,124,16,0.04) 0%, transparent 60%),
            linear-gradient(180deg, #080808 0%, #0a0a0a 60%, #080808 100%)
          `,
        }}
      />

      {/* Fine grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Console silhouette */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div
          className="animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          <svg
            viewBox="0 0 320 560"
            className="w-56 sm:w-64 md:w-72 lg:w-80 xl:w-96 opacity-[0.055]"
            fill="none"
            aria-hidden="true"
          >
            {/* Xbox Series X body — simplified rectangle with chamfered corners */}
            <rect x="40" y="20" width="240" height="520" rx="28" fill="white" />
            <rect x="56" y="36" width="208" height="488" rx="20" fill="#080808" />
            {/* Vent grille lines */}
            {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map((i) => (
              <line
                key={i}
                x1="70" y1={60 + i * 10}
                x2="250" y2={60 + i * 10}
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            ))}
            {/* Xbox button circle */}
            <circle cx="160" cy="340" r="42" fill="white" opacity="0.9" />
            <circle cx="160" cy="340" r="34" fill="#080808" />
            {/* Disc drive slot */}
            <rect x="70" y="460" width="180" height="4" rx="2" fill="white" opacity="0.5" />
            {/* USB port */}
            <rect x="70" y="480" width="24" height="10" rx="3" fill="white" opacity="0.4" />
            {/* Power button */}
            <circle cx="160" cy="510" r="8" fill="white" opacity="0.35" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pb-20 lg:pb-28">
        {/* Label */}
        <div className="animate-fade-up mb-6">
          <span className="section-label">The Most Powerful Console Ever Built</span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up-delay-1 font-black leading-none tracking-tight"
          style={{ fontSize: 'clamp(3rem, 8vw, 7.5rem)', letterSpacing: '-0.04em' }}
        >
          <span className="text-gradient block">Power</span>
          <span className="text-gradient block">Your</span>
          <span className="text-gradient-green block">Dreams.</span>
        </h1>

        {/* Sub */}
        <p
          className="animate-fade-up-delay-2 mt-8 text-[#7a7a7a] font-light leading-relaxed max-w-xl"
          style={{ fontSize: 'clamp(1rem, 1.5vw, 1.2rem)' }}
        >
          Xbox Series X redefines what a console can do — delivering cinematic 4K visuals,
          up to 120 frames per second, and near-instant load times across every game you play.
        </p>

        {/* Pillars */}
        <div className="animate-fade-up-delay-3 mt-12 flex flex-wrap gap-4">
          {pillars.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 px-4 py-2.5 glass-card rounded-sm"
            >
              <Icon size={14} className="text-[#107C10] flex-shrink-0" strokeWidth={2} />
              <span className="text-[#c0c0c0] text-xs font-medium tracking-wider uppercase">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="animate-fade-up-delay-3 mt-10 flex flex-wrap items-center gap-5">
          <a
            href="#performance"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#performance')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-7 py-3.5 bg-[#107C10] hover:bg-[#0d6a0d] text-white text-sm font-semibold rounded-sm tracking-wide transition-colors duration-200"
          >
            Discover Performance
          </a>
          <a
            href="#specs"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#specs')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-[#8a8a8a] hover:text-[#f0f0f0] text-sm font-medium tracking-wide transition-colors duration-200"
          >
            View Full Specs
            <span className="text-[#107C10]">→</span>
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-[#107C10]" />
        <ArrowDown size={14} className="text-[#107C10]" />
      </div>
    </section>
  );
}
