import { useEffect, useRef, useState } from 'react';
import { Cpu, Layers, Database, HardDrive, Activity, Gauge } from 'lucide-react';

const stats = [
  {
    icon: Activity,
    value: '12',
    unit: 'TFLOPS',
    label: 'GPU Performance',
    description: 'Custom AMD RDNA 2 architecture delivers 12 teraflops of raw GPU power — twice that of Xbox One X.',
  },
  {
    icon: Cpu,
    value: '3.8',
    unit: 'GHz',
    label: 'CPU Clock Speed',
    description: 'Custom 8-core AMD Zen 2 processor, capable of 3.8GHz unconstrained or 3.6GHz with SMT enabled.',
  },
  {
    icon: Layers,
    value: '16',
    unit: 'GB',
    label: 'GDDR6 Memory',
    description: '10GB of 560GB/s GDDR6 for the GPU, plus 6GB at 336GB/s for background OS and compute tasks.',
  },
  {
    icon: HardDrive,
    value: '2.4',
    unit: 'GB/s',
    label: 'NVMe SSD Speed',
    description: 'Custom-designed 1TB NVMe SSD with 2.4GB/s raw throughput and up to 4.8GB/s compressed.',
  },
  {
    icon: Gauge,
    value: '120',
    unit: 'FPS',
    label: 'Max Framerate',
    description: 'Supports up to 120 frames per second with compatible displays, delivering buttery-smooth gameplay.',
  },
  {
    icon: Database,
    value: '4K',
    unit: 'UHD',
    label: 'Native Resolution',
    description: 'True 4K rendering at 3840×2160 — not upscaled — with DirectX Raytracing for lifelike lighting.',
  },
];

function StatCard({ icon: Icon, value, unit, label, description, index }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="glass-card glass-card-hover rounded-sm p-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ${index * 0.08}s ease, transform 0.7s ${index * 0.08}s ease`,
      }}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-10 h-10 rounded-sm bg-[rgba(16,124,16,0.1)] border border-[rgba(16,124,16,0.15)] flex items-center justify-center">
          <Icon size={18} className="text-[#107C10]" strokeWidth={1.5} />
        </div>
        <span className="section-label">{label}</span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="stat-number text-[#f0f0f0] font-black" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '-0.05em' }}>
            {value}
          </span>
          <span className="text-[#107C10] font-semibold text-lg tracking-wide">{unit}</span>
        </div>
      </div>

      <div className="w-8 h-px bg-[#107C10] mb-4 opacity-60" />

      <p className="text-[#6a6a6a] text-sm leading-relaxed font-light">
        {description}
      </p>
    </div>
  );
}

export default function Performance() {
  return (
    <section id="performance" className="py-24 lg:py-36">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="mb-16 lg:mb-20">
          <div className="mb-4">
            <span className="section-label">Hardware Engineering</span>
          </div>
          <h2
            className="font-black text-gradient leading-none tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em' }}
          >
            Built for the Future.
          </h2>
          <p className="text-[#6a6a6a] font-light leading-relaxed max-w-2xl" style={{ fontSize: '1.05rem' }}>
            Every component in the Xbox Series X was engineered from the ground up —
            not spec-checked off a list, but purpose-built to remove every bottleneck
            standing between you and the game.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
