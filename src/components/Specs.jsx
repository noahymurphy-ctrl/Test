import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

const specGroups = [
  {
    group: 'Processor',
    specs: [
      { label: 'CPU', value: 'Custom AMD Zen 2 — 8 Cores @ 3.8GHz (3.6GHz w/ SMT)' },
      { label: 'GPU', value: 'Custom AMD RDNA 2 — 52 CUs @ 1.825GHz' },
      { label: 'GPU Performance', value: '12 Teraflops' },
      { label: 'Process Node', value: 'TSMC 7nm Enhanced' },
    ],
  },
  {
    group: 'Memory & Storage',
    specs: [
      { label: 'RAM', value: '16GB GDDR6 w/ 320MB bus' },
      { label: 'Memory Bandwidth', value: '10GB @ 560GB/s · 6GB @ 336GB/s' },
      { label: 'Internal Storage', value: '1TB Custom NVMe SSD' },
      { label: 'I/O Throughput', value: '2.4GB/s Raw · 4.8GB/s Compressed' },
      { label: 'Storage Expandable', value: '1TB Seagate Expansion Card (proprietary)' },
      { label: 'External Storage', value: 'USB 3.1 HDD / SSD (Xbox One games only)' },
    ],
  },
  {
    group: 'Display & Graphics',
    specs: [
      { label: 'Resolution', value: 'Up to 8K (native 4K UHD gaming)' },
      { label: 'Frame Rate', value: 'Up to 120fps' },
      { label: 'HDR', value: 'HDR10 · Dolby Vision · Auto HDR' },
      { label: 'Ray Tracing', value: 'DirectX Raytracing (hardware-accelerated)' },
      { label: 'Variable Refresh Rate', value: 'AMD FreeSync Premium (20–120Hz)' },
      { label: 'Color Depth', value: '10-bit color (1.07 billion colors)' },
    ],
  },
  {
    group: 'Audio',
    specs: [
      { label: 'Spatial Audio', value: 'Dolby Atmos · DTS:X · Windows Sonic' },
      { label: 'Audio Processing', value: 'Custom Sound Processing Unit (SPU)' },
      { label: 'HDMI Output', value: 'HDMI 2.1 (4K @ 120Hz · eARC)' },
    ],
  },
  {
    group: 'Connectivity & Ports',
    specs: [
      { label: 'HDMI', value: 'HDMI 2.1' },
      { label: 'USB', value: '3× USB-A 3.1 Gen 1' },
      { label: 'Networking', value: '802.11ax Wi-Fi 6 · 802.3 Gigabit Ethernet' },
      { label: 'Bluetooth', value: 'Bluetooth 5.0' },
      { label: 'Expansion', value: '1× Seagate Storage Expansion Card slot' },
    ],
  },
  {
    group: 'Physical',
    specs: [
      { label: 'Dimensions', value: '301mm × 151mm × 151mm (Vertical)' },
      { label: 'Weight', value: '4.45 kg / 9.8 lbs' },
      { label: 'Disc Drive', value: '4K UHD Blu-ray · Blu-ray · DVD' },
      { label: 'Power Supply', value: 'Internal · 315W' },
      { label: 'Launch', value: 'November 10, 2020' },
    ],
  },
];

function SpecGroup({ group, specs, groupIndex }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="glass-card rounded-sm overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ${groupIndex * 0.08}s ease, transform 0.6s ${groupIndex * 0.08}s ease`,
      }}
    >
      {/* Group header */}
      <div className="px-7 py-5 border-b border-white/[0.05] flex items-center gap-3">
        <ChevronRight size={12} className="text-[#107C10]" strokeWidth={2.5} />
        <span className="section-label">{group}</span>
      </div>

      {/* Rows */}
      <div>
        {specs.map((spec, i) => (
          <div
            key={spec.label}
            className={`grid grid-cols-1 sm:grid-cols-[200px_1fr] px-7 py-4 gap-2 sm:gap-6 ${
              i < specs.length - 1 ? 'border-b border-white/[0.03]' : ''
            }`}
          >
            <div className="text-[#4a4a4a] text-xs font-medium tracking-wide uppercase self-center">
              {spec.label}
            </div>
            <div className="text-[#c0c0c0] text-sm font-light leading-relaxed">
              {spec.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Specs() {
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
    <section id="specs" className="py-24 lg:py-36">
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
            <span className="section-label">Technical Specifications</span>
          </div>
          <h2
            className="font-black text-gradient leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em' }}
          >
            Full Specifications.
          </h2>
        </div>

        {/* Spec groups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {specGroups.map((g, i) => (
            <SpecGroup key={g.group} {...g} groupIndex={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
