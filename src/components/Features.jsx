import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Sparkles, Globe, Gamepad2, Wifi, Film } from 'lucide-react';

const features = [
  {
    icon: RefreshCw,
    title: 'Quick Resume',
    subtitle: 'Multi-game suspend',
    body: 'Instantly switch between multiple titles — right where you left off — without a single loading screen. No waiting, no replaying, no interruption.',
  },
  {
    icon: Sparkles,
    title: 'Auto HDR',
    subtitle: 'Automatic enhancement',
    body: 'Thousands of backward-compatible games automatically receive a richer, more vibrant HDR color palette — no developer patches required.',
  },
  {
    icon: Globe,
    title: 'Smart Delivery',
    subtitle: 'Buy once, play best',
    body: 'Purchase a game once and automatically receive the most optimized version for your hardware — current or next generation.',
  },
  {
    icon: Gamepad2,
    title: 'Backward Compatibility',
    subtitle: 'Four generations, one console',
    body: 'Play thousands of Xbox One, Xbox 360, and original Xbox games with enhanced resolution, frame rate, and load time improvements.',
  },
  {
    icon: Wifi,
    title: 'Xbox Game Pass',
    subtitle: 'Over 100 premium titles',
    body: 'Access a curated library of over 100 high-quality games — including every first-party Microsoft Studios title on day one of release.',
  },
  {
    icon: Film,
    title: 'DirectX Raytracing',
    subtitle: 'Hardware-accelerated RT',
    body: 'Real-time raytracing renders light, shadow, and reflection with cinematic realism — powered by dedicated hardware within the GPU.',
  },
];

function FeatureCard({ icon: Icon, title, subtitle, body, index }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ${index * 0.07}s ease, transform 0.6s ${index * 0.07}s ease`,
      }}
    >
      <div className="glass-card glass-card-hover rounded-sm p-7 h-full flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-9 h-9 rounded-sm bg-[rgba(16,124,16,0.08)] border border-[rgba(16,124,16,0.12)] flex items-center justify-center flex-shrink-0">
            <Icon size={16} className="text-[#107C10]" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-[#f0f0f0] font-semibold text-sm tracking-wide">{title}</div>
            <div className="text-[#4a4a4a] text-xs font-medium tracking-wider uppercase mt-0.5">{subtitle}</div>
          </div>
        </div>

        <div className="w-6 h-px bg-[rgba(16,124,16,0.4)] mb-5" />

        <p className="text-[#6a6a6a] text-sm leading-relaxed font-light flex-1">
          {body}
        </p>
      </div>
    </div>
  );
}

export default function Features() {
  const headerRef = useRef(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHeaderVisible(true); },
      { threshold: 0.1 }
    );
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="py-24 lg:py-36">
      {/* Section background accent */}
      <div
        className="absolute left-0 right-0 h-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 20% 50%, rgba(16,124,16,0.04) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* Divider */}
        <div className="divider mb-20" />

        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16 lg:mb-20"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <div>
            <div className="mb-4">
              <span className="section-label">Platform Intelligence</span>
            </div>
            <h2
              className="font-black text-gradient leading-none tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em' }}
            >
              Designed Around
              <br />
              the Player.
            </h2>
          </div>
          <p className="text-[#6a6a6a] font-light leading-relaxed lg:max-w-sm lg:text-right" style={{ fontSize: '0.95rem' }}>
            Beyond raw power — a suite of platform technologies that quietly
            elevate every moment of your gaming experience.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
