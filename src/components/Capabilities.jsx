import { useEffect, useRef, useState } from 'react';
import {
  Layers, Volume2, Zap,
  Users, Monitor, Headphones,
} from 'lucide-react';

const CAPABILITIES = [
  {
    icon:    Layers,
    heading: 'Variable Rate Shading',
    text:    'Selectively applies full shading detail only where it matters most — freeing GPU cycles for higher resolution or frame rates without perceptible visual loss.',
  },
  {
    icon:    Volume2,
    heading: 'Dolby Atmos & DTS:X',
    text:    'Native spatial audio formats place sound precisely in three-dimensional space. Critical for competitive gaming, and transformative for cinematic single-player titles.',
  },
  {
    icon:    Zap,
    heading: 'Xbox Velocity Architecture',
    text:    'Custom SSD, hardware decompressor, DirectStorage, and Sampler Feedback Streaming work as one system to eliminate the streaming constraints of the last generation.',
  },
  {
    icon:    Users,
    heading: 'Xbox Play Anywhere',
    text:    'Buy supported titles once and play on Xbox Series X or Windows PC — your saves, achievements, and progress follow you seamlessly across every platform.',
  },
  {
    icon:    Monitor,
    heading: 'AMD FreeSync Premium',
    text:    '20–120 Hz adaptive sync via HDMI 2.1 eliminates screen tearing and reduces latency without the stutter of V-Sync — smooth and tear-free at any frame rate.',
  },
  {
    icon:    Headphones,
    heading: 'Custom Sound Processing Unit',
    text:    'A dedicated SPU offloads thousands of simultaneous real-time audio sources from the CPU, delivering spatial precision that was impossible on last-generation hardware.',
  },
];

function useVisible(threshold = 0.1) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Row({ icon: Icon, heading, text, index }) {
  const [ref, visible] = useVisible(0.08);
  return (
    <div
      ref={ref}
      className="grid grid-cols-[40px_1fr] gap-6 py-8 border-b border-white/[0.04] last:border-0"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateX(0)' : 'translateX(-14px)',
        transition: `opacity 0.6s ${index * 0.055}s ease, transform 0.6s ${index * 0.055}s ease`,
      }}
    >
      {/* Icon */}
      <div className="icon-box mt-0.5 w-9 h-9 rounded-[4px]">
        <Icon size={15} strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8">
        <h3
          className="text-[#D0D0D0] font-semibold text-[13px] tracking-wide shrink-0"
          style={{ minWidth: '210px' }}
        >
          {heading}
        </h3>
        <p className="text-[#505050] text-[13px] font-light leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export default function Capabilities() {
  const [hRef, hVisible] = useVisible(0.1);

  return (
    <section id="capabilities" className="section-pad bg-[#0A0A0A]">
      <div className="container">

        {/* ── Rule ── */}
        <div className="rule mb-16 lg:mb-20" />

        {/* ── Header ── */}
        <div
          ref={hRef}
          className="mb-14"
          style={{
            opacity:    hVisible ? 1 : 0,
            transform:  hVisible ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <p className="label mb-4">Advanced Capabilities</p>
          <h2
            className="font-black text-gradient leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', letterSpacing: '-0.04em' }}
          >
            Every Detail,<br />Engineered.
          </h2>
        </div>

        {/* ── List ── */}
        <div className="max-w-5xl">
          {CAPABILITIES.map((c, i) => (
            <Row key={c.heading} {...c} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
