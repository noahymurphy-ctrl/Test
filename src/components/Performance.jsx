import { useEffect, useRef, useState } from 'react';
import { Cpu, Layers, Database, HardDrive, Gauge, MonitorDot } from 'lucide-react';

const STATS = [
  {
    icon:  Gauge,
    value: '12',
    unit:  'TFLOPS',
    label: 'GPU Performance',
    body:  'Custom AMD RDNA 2 — 52 compute units at 1.825 GHz. Twice the raw GPU power of Xbox One X, with dedicated hardware for ray tracing.',
  },
  {
    icon:  Cpu,
    value: '3.8',
    unit:  'GHz',
    label: 'CPU Clock Speed',
    body:  'Custom 8-core AMD Zen 2 processor. Runs at 3.8 GHz unconstrained or 3.6 GHz with SMT enabled — no compromises for game or OS tasks.',
  },
  {
    icon:  Layers,
    value: '16',
    unit:  'GB',
    label: 'GDDR6 Memory',
    body:  'Split bandwidth design: 10 GB at 560 GB/s feeds the GPU; 6 GB at 336 GB/s handles background OS and compute tasks simultaneously.',
  },
  {
    icon:  HardDrive,
    value: '2.4',
    unit:  'GB/s',
    label: 'SSD Throughput',
    body:  'Custom 1 TB NVMe SSD with 2.4 GB/s raw throughput, scaling to 4.8 GB/s with the Velocity Architecture hardware decompressor.',
  },
  {
    icon:  MonitorDot,
    value: '120',
    unit:  'FPS',
    label: 'Max Frame Rate',
    body:  'Up to 120 frames per second on compatible displays — delivering ultra-smooth motion for competitive games and fast-paced action titles.',
  },
  {
    icon:  Database,
    value: '4K',
    unit:  'UHD',
    label: 'Native Resolution',
    body:  'True 3840 × 2160 — not upscaled. Combined with DirectX Raytracing, every frame is rendered with cinematic detail and real-time lighting.',
  },
];

function useVisible(threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function StatCard({ icon: Icon, value, unit, label, body, index }) {
  const [ref, visible] = useVisible(0.12);
  return (
    <div
      ref={ref}
      className="card p-7 flex flex-col"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.65s ${index * 0.07}s ease, transform 0.65s ${index * 0.07}s ease`,
      }}
    >
      {/* Icon + label row */}
      <div className="flex items-center justify-between mb-6">
        <div className="icon-box">
          <Icon size={17} strokeWidth={1.5} />
        </div>
        <span className="label text-[10px]">{label}</span>
      </div>

      {/* Number */}
      <div className="flex items-baseline gap-2 mb-4">
        <span
          className="stat-num text-[#EFEFEF] font-black"
          style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.25rem)', letterSpacing: '-0.05em' }}
        >
          {value}
        </span>
        <span className="text-[#107C10] font-semibold text-base tracking-wide">{unit}</span>
      </div>

      {/* Rule */}
      <div className="w-7 h-px bg-[rgba(16,124,16,0.45)] mb-4" />

      {/* Description */}
      <p className="text-[#555] text-[13px] leading-relaxed font-light flex-1">
        {body}
      </p>
    </div>
  );
}

export default function Performance() {
  const [hRef, hVisible] = useVisible(0.1);

  return (
    <section id="performance" className="section-pad bg-[#0A0A0A]">
      <div className="container">

        {/* ── Rule ── */}
        <div className="rule mb-16 lg:mb-20" />

        {/* ── Header ── */}
        <div
          ref={hRef}
          className="mb-14 lg:mb-16"
          style={{
            opacity:    hVisible ? 1 : 0,
            transform:  hVisible ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <p className="label mb-4">Hardware Engineering</p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <h2
              className="font-black text-gradient leading-none tracking-tight"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', letterSpacing: '-0.04em' }}
            >
              Built for<br />the Future.
            </h2>
            <p className="text-[#5A5A5A] font-light leading-relaxed lg:max-w-[380px] lg:text-right text-[0.95rem]">
              Every component engineered from scratch — not spec-checked,
              but purpose-built to remove every bottleneck between you and the game.
            </p>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATS.map((s, i) => (
            <StatCard key={s.label} {...s} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
