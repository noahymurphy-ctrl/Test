import { useEffect, useRef, useState } from 'react';
import {
  FastForward, Sparkles, PackageCheck,
  Gamepad2, CloudLightning, Scan,
} from 'lucide-react';

const HERO_FEATURE = {
  icon:     FastForward,
  title:    'Quick Resume',
  subtitle: 'Multi-game instant switching',
  body:     'Suspend up to five games simultaneously — each frozen exactly where you left it. Switch between them in seconds with zero loading screens. No interruption. No penalty. Just play.',
  stat1:    { value: '5',    label: 'Concurrent games'   },
  stat2:    { value: '~2s',  label: 'Average resume time' },
};

const FEATURES = [
  {
    icon:     Sparkles,
    title:    'Auto HDR',
    subtitle: 'Automatic enhancement',
    body:     'AI-driven HDR retrofits thousands of backward-compatible titles with a wider, more vibrant color range — no developer patch required.',
  },
  {
    icon:     PackageCheck,
    title:    'Smart Delivery',
    subtitle: 'Buy once, play best',
    body:     'Purchase a supported title once and receive the optimal version for your hardware automatically — today and across future generations.',
  },
  {
    icon:     Gamepad2,
    title:    'Backward Compatibility',
    subtitle: 'Four console generations',
    body:     'Thousands of Xbox, Xbox 360, and Xbox One games run with enhanced resolution, frame rates, and HDR — without patches.',
  },
  {
    icon:     CloudLightning,
    title:    'Xbox Velocity Architecture',
    subtitle: 'Hardware-software co-design',
    body:     'The custom SSD, hardware decompressor, and DirectStorage pipeline eliminate streaming limits that constrained last-generation open worlds.',
  },
  {
    icon:     Scan,
    title:    'DirectX Raytracing',
    subtitle: 'Hardware-accelerated RT',
    body:     'Dedicated RT cores render lifelike shadows, reflections, and global illumination in real time — a first for console gaming.',
  },
];

function useVisible(threshold = 0.12) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FeatureCard({ icon: Icon, title, subtitle, body, index }) {
  const [ref, visible] = useVisible(0.1);
  return (
    <div
      ref={ref}
      className="card p-7 flex flex-col h-full"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.6s ${index * 0.06}s ease, transform 0.6s ${index * 0.06}s ease`,
      }}
    >
      {/* Icon + title */}
      <div className="flex items-start gap-4 mb-5">
        <div className="icon-box mt-0.5">
          <Icon size={16} strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-[#EFEFEF] font-semibold text-sm tracking-wide">{title}</h3>
          <p className="text-[#3C3C3C] text-[11px] font-medium tracking-[0.08em] uppercase mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="w-5 h-px bg-[rgba(16,124,16,0.4)] mb-5" />

      <p className="text-[#5A5A5A] text-[13px] leading-relaxed font-light flex-1">{body}</p>
    </div>
  );
}

export default function Features() {
  const [hRef, hVisible]    = useVisible(0.1);
  const [heroRef, heroVis]  = useVisible(0.08);
  const { icon: HeroIcon }  = HERO_FEATURE;

  return (
    <section id="features" className="section-pad bg-[#080808]">
      <div className="container">

        {/* ── Rule ── */}
        <div className="rule mb-16 lg:mb-20" />

        {/* ── Section header ── */}
        <div
          ref={hRef}
          className="mb-14 lg:mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5"
          style={{
            opacity:    hVisible ? 1 : 0,
            transform:  hVisible ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <div>
            <p className="label mb-4">Platform Intelligence</p>
            <h2
              className="font-black text-gradient leading-none tracking-tight"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', letterSpacing: '-0.04em' }}
            >
              Designed Around<br />the Player.
            </h2>
          </div>
          <p className="text-[#5A5A5A] font-light leading-relaxed lg:max-w-[360px] lg:text-right text-[0.95rem]">
            Beyond raw power — a suite of platform technologies that quietly
            elevate every moment you spend inside a game.
          </p>
        </div>

        {/* ── Hero feature (Quick Resume) ── */}
        <div
          ref={heroRef}
          className="card mb-4 overflow-hidden"
          style={{
            opacity:    heroVis ? 1 : 0,
            transform:  heroVis ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.75s ease, transform 0.75s ease',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: text */}
            <div className="p-8 lg:p-12 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="icon-box w-9 h-9">
                    <HeroIcon size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[#EFEFEF] font-semibold text-base tracking-wide">
                      {HERO_FEATURE.title}
                    </h3>
                    <p className="text-[#3C3C3C] text-[11px] font-medium tracking-[0.08em] uppercase mt-0.5">
                      {HERO_FEATURE.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-[#6A6A6A] text-[0.9375rem] leading-[1.8] font-light max-w-[420px]">
                  {HERO_FEATURE.body}
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-10 pt-8 mt-8 border-t border-white/[0.04]">
                <div>
                  <p className="stat-num text-[#EFEFEF] font-black text-3xl" style={{ letterSpacing: '-0.04em' }}>
                    {HERO_FEATURE.stat1.value}
                  </p>
                  <p className="text-[#404040] text-[11px] font-medium tracking-[0.08em] uppercase mt-1">
                    {HERO_FEATURE.stat1.label}
                  </p>
                </div>
                <div>
                  <p className="stat-num text-[#EFEFEF] font-black text-3xl" style={{ letterSpacing: '-0.04em' }}>
                    {HERO_FEATURE.stat2.value}
                  </p>
                  <p className="text-[#404040] text-[11px] font-medium tracking-[0.08em] uppercase mt-1">
                    {HERO_FEATURE.stat2.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: visual */}
            <div className="border-t lg:border-t-0 lg:border-l border-white/[0.04] bg-[#0D0D0D] p-8 lg:p-12 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                {[
                  { label: 'Halo Infinite',   active: true  },
                  { label: 'Starfield',        active: false },
                  { label: 'Forza Horizon',    active: false },
                  { label: 'Sea of Thieves',   active: false },
                  { label: 'Minecraft',        active: false },
                  { label: 'Cyberpunk 2077',   active: false },
                ].map((g, i) => (
                  <div
                    key={g.label}
                    className="rounded-[3px] p-3 flex flex-col items-center gap-2 text-center transition-colors duration-200"
                    style={{
                      background: g.active ? 'rgba(16,124,16,0.08)' : 'rgba(255,255,255,0.025)',
                      border:     `1px solid ${g.active ? 'rgba(16,124,16,0.22)' : 'rgba(255,255,255,0.055)'}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: g.active ? '#107C10' : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <div
                        className="rounded-full"
                        style={{
                          width:  g.active ? '6px' : '4px',
                          height: g.active ? '6px' : '4px',
                          background: g.active ? 'white' : 'rgba(255,255,255,0.3)',
                        }}
                      />
                    </div>
                    <span
                      className="text-[9px] leading-tight font-medium tracking-wide"
                      style={{ color: g.active ? '#EFEFEF' : '#3C3C3C' }}
                    >
                      {g.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
