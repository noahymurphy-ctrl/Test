import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Volume2, Swords, Users, Shield, Headphones } from 'lucide-react';

const capabilities = [
  {
    icon: TrendingUp,
    heading: 'Variable Rate Shading',
    text: 'Selectively applies shading detail where it matters most, freeing GPU resources for higher resolution or frame rates elsewhere in the scene.',
  },
  {
    icon: Volume2,
    heading: 'Dolby Atmos & DTS:X',
    text: 'Native support for spatial audio formats delivers precise positional sound — critical for competitive gaming and immersive cinematic experiences.',
  },
  {
    icon: Swords,
    heading: 'Xbox Velocity Architecture',
    text: 'A hardware-software co-design that integrates the custom SSD, decompression hardware, and DirectStorage to eliminate HDD-era world streaming limits.',
  },
  {
    icon: Users,
    heading: 'Xbox Party & Social',
    text: 'Party chat, cross-platform clubs, and Looking for Group features keep your community connected seamlessly across consoles, PC, and mobile.',
  },
  {
    icon: Shield,
    heading: 'Xbox Play Anywhere',
    text: 'Buy supported titles once and play on Xbox Series X or Windows PC — your saves, achievements, and progress follow you across platforms.',
  },
  {
    icon: Headphones,
    heading: 'Low-Latency Audio',
    text: 'Hardware-accelerated audio processing with the Custom Sound Processing Unit offloads thousands of simultaneous audio sources from the CPU.',
  },
];

function Row({ icon: Icon, heading, text, index }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-[auto_1fr] gap-5 py-8 border-b border-white/[0.04] last:border-0"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-16px)',
        transition: `opacity 0.6s ${index * 0.06}s ease, transform 0.6s ${index * 0.06}s ease`,
      }}
    >
      <div className="w-9 h-9 rounded-sm bg-[rgba(16,124,16,0.07)] border border-[rgba(16,124,16,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-[#107C10]" strokeWidth={1.5} />
      </div>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-6 gap-2">
          <h3 className="text-[#e0e0e0] font-semibold text-sm tracking-wide min-w-[200px]">
            {heading}
          </h3>
          <p className="text-[#5a5a5a] text-sm font-light leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Capabilities() {
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
    <section id="capabilities" className="py-24 lg:py-36">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Divider */}
        <div className="divider mb-20" />

        {/* Header */}
        <div
          ref={headerRef}
          className="mb-14"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <div className="mb-4">
            <span className="section-label">Advanced Capabilities</span>
          </div>
          <h2
            className="font-black text-gradient leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em' }}
          >
            Every Detail,
            <br />
            Engineered.
          </h2>
        </div>

        {/* Capabilities list */}
        <div className="max-w-4xl">
          {capabilities.map((c, i) => (
            <Row key={c.heading} {...c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
