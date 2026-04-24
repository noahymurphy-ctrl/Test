import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

const SPEC_GROUPS = [
  {
    group: 'Processor',
    specs: [
      { label: 'CPU',            value: 'Custom AMD Zen 2 — 8 Cores @ 3.8 GHz (3.6 GHz w/ SMT)' },
      { label: 'GPU',            value: 'Custom AMD RDNA 2 — 52 CUs @ 1.825 GHz' },
      { label: 'GPU Performance',value: '12 Teraflops' },
      { label: 'Process Node',   value: 'TSMC 7nm Enhanced' },
    ],
  },
  {
    group: 'Memory & Storage',
    specs: [
      { label: 'RAM',             value: '16 GB GDDR6 / 320-bit bus' },
      { label: 'Bandwidth',       value: '10 GB @ 560 GB/s · 6 GB @ 336 GB/s' },
      { label: 'Internal SSD',    value: '1 TB Custom NVMe' },
      { label: 'I/O Throughput',  value: '2.4 GB/s raw · 4.8 GB/s compressed' },
      { label: 'Expandable',      value: '1 TB Seagate Expansion Card (proprietary slot)' },
      { label: 'External',        value: 'USB 3.1 HDD / SSD (Xbox One titles only)' },
    ],
  },
  {
    group: 'Display & Graphics',
    specs: [
      { label: 'Resolution',      value: 'Up to 8K · Native 4K UHD (3840 × 2160)' },
      { label: 'Frame Rate',      value: 'Up to 120 fps' },
      { label: 'HDR',             value: 'HDR10 · Dolby Vision · Auto HDR' },
      { label: 'Ray Tracing',     value: 'DirectX Raytracing — hardware-accelerated' },
      { label: 'Variable Refresh',value: 'AMD FreeSync Premium 20–120 Hz' },
      { label: 'Color Depth',     value: '10-bit (1.07 billion colors)' },
    ],
  },
  {
    group: 'Audio',
    specs: [
      { label: 'Spatial Audio',   value: 'Dolby Atmos · DTS:X · Windows Sonic' },
      { label: 'Processing',      value: 'Custom Sound Processing Unit (SPU)' },
      { label: 'HDMI Output',     value: 'HDMI 2.1 — 4K @ 120 Hz, eARC' },
    ],
  },
  {
    group: 'Connectivity',
    specs: [
      { label: 'HDMI',            value: 'HDMI 2.1' },
      { label: 'USB',             value: '3× USB-A 3.1 Gen 1' },
      { label: 'Wi-Fi',           value: '802.11ax Wi-Fi 6' },
      { label: 'Ethernet',        value: '802.3 Gigabit' },
      { label: 'Bluetooth',       value: '5.0' },
      { label: 'Storage Slot',    value: '1× Seagate Expansion Card slot' },
    ],
  },
  {
    group: 'Physical',
    specs: [
      { label: 'Dimensions',      value: '301 mm × 151 mm × 151 mm (vertical)' },
      { label: 'Weight',          value: '4.45 kg / 9.8 lbs' },
      { label: 'Disc Drive',      value: '4K UHD Blu-ray · Blu-ray · DVD' },
      { label: 'Power Supply',    value: 'Internal · 315 W' },
      { label: 'Launch',          value: 'November 10, 2020' },
    ],
  },
];

function useVisible(threshold = 0.08) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function SpecGroup({ group, specs, groupIndex }) {
  const [ref, visible] = useVisible(0.06);
  return (
    <div
      ref={ref}
      className="card overflow-hidden"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.6s ${groupIndex * 0.07}s ease, transform 0.6s ${groupIndex * 0.07}s ease`,
      }}
    >
      {/* Group header */}
      <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2.5">
        <ChevronRight size={11} className="text-[#107C10]" strokeWidth={2.5} />
        <span className="label text-[10px]">{group}</span>
      </div>

      {/* Rows */}
      {specs.map((s, i) => (
        <div
          key={s.label}
          className={`grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-6 px-6 py-4 ${
            i < specs.length - 1 ? 'border-b border-white/[0.03]' : ''
          }`}
        >
          <p className="text-[#3C3C3C] text-[11px] font-medium tracking-[0.07em] uppercase self-center">
            {s.label}
          </p>
          <p className="text-[#AEAEAE] text-[13px] font-light leading-relaxed">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function Specs() {
  const [hRef, hVisible] = useVisible(0.1);

  return (
    <section id="specs" className="section-pad bg-[#080808]">
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
          <p className="label mb-4">Technical Specifications</p>
          <h2
            className="font-black text-gradient leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', letterSpacing: '-0.04em' }}
          >
            Full Specifications.
          </h2>
        </div>

        {/* ── Spec grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SPEC_GROUPS.map((g, i) => (
            <SpecGroup key={g.group} {...g} groupIndex={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
