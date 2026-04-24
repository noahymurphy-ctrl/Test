import { useEffect, useRef, useState } from 'react';
import { Check, Minus } from 'lucide-react';

const ROWS = [
  { spec: 'GPU Performance',     x: '12 TFLOPS',       s: '4 TFLOPS',         highlight: true  },
  { spec: 'Target Resolution',   x: '4K Native',       s: '1440p Native',     highlight: true  },
  { spec: 'Max Frame Rate',      x: '120 fps',         s: '120 fps',          highlight: false },
  { spec: 'CPU',                 x: '8-core Zen 2 @ 3.8 GHz', s: '8-core Zen 2 @ 3.6 GHz', highlight: false },
  { spec: 'Memory',              x: '16 GB GDDR6',     s: '10 GB GDDR6',      highlight: true  },
  { spec: 'Internal Storage',    x: '1 TB NVMe SSD',   s: '512 GB NVMe SSD',  highlight: true  },
  { spec: 'Optical Drive',       x: '4K UHD Blu-ray',  s: 'Digital only',     highlight: false },
  { spec: 'Hardware Ray Tracing',x: true,              s: true,               highlight: false },
  { spec: 'Auto HDR',            x: true,              s: true,               highlight: false },
  { spec: 'Quick Resume',        x: true,              s: true,               highlight: false },
  { spec: 'Wi-Fi',               x: 'Wi-Fi 6 (802.11ax)', s: 'Wi-Fi 5 (802.11ac)', highlight: false },
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

function CellValue({ val, isX }) {
  if (val === true)  return <Check size={14} className="text-[#4CAF50]" strokeWidth={2.5} />;
  if (val === false) return <Minus size={14} className="text-[#404040]" strokeWidth={2} />;
  return (
    <span
      className={`text-[13px] font-light leading-snug ${
        isX ? 'text-[#EFEFEF]' : 'text-[#606060]'
      }`}
    >
      {val}
    </span>
  );
}

export default function Comparison() {
  const [hRef, hVisible] = useVisible(0.1);
  const [tRef, tVisible] = useVisible(0.06);

  return (
    <section id="compare" className="section-pad bg-[#0A0A0A]">
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
          <p className="label mb-4">Xbox Family</p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <h2
              className="font-black text-gradient leading-none tracking-tight"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', letterSpacing: '-0.04em' }}
            >
              Series X vs<br />Series S.
            </h2>
            <p className="text-[#5A5A5A] font-light leading-relaxed lg:max-w-[360px] lg:text-right text-[0.95rem]">
              Two consoles. One generation. Choose the configuration that fits your setup and how you play.
            </p>
          </div>
        </div>

        {/* ── Table ── */}
        <div
          ref={tRef}
          className="overflow-x-auto"
          style={{
            opacity:    tVisible ? 1 : 0,
            transform:  tVisible ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.75s ease, transform 0.75s ease',
          }}
        >
          <table className="w-full min-w-[560px] border-collapse">
            {/* Head */}
            <thead>
              <tr>
                <th className="text-left px-5 py-4 text-[11px] font-medium tracking-[0.1em] uppercase text-[#3C3C3C] w-[40%]">
                  Specification
                </th>
                {/* Series X col */}
                <th className="px-5 py-4 text-left w-[30%]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#107C10]" />
                    <span className="text-[#EFEFEF] font-semibold text-sm tracking-wide">Series X</span>
                  </div>
                </th>
                {/* Series S col */}
                <th className="px-5 py-4 text-left w-[30%]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#3C3C3C]" />
                    <span className="text-[#5A5A5A] font-semibold text-sm tracking-wide">Series S</span>
                  </div>
                </th>
              </tr>
              {/* Underline */}
              <tr>
                <td colSpan={3}>
                  <div className="h-px bg-white/[0.055] mx-5" />
                </td>
              </tr>
            </thead>

            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.spec}
                  className={`group transition-colors duration-150 ${
                    row.highlight ? 'bg-[rgba(16,124,16,0.025)]' : ''
                  } hover:bg-white/[0.018]`}
                >
                  {/* Spec label */}
                  <td className="px-5 py-4 border-b border-white/[0.03]">
                    <span className="text-[#4A4A4A] text-[12px] font-medium tracking-wide">
                      {row.spec}
                    </span>
                  </td>
                  {/* Series X value */}
                  <td className="px-5 py-4 border-b border-white/[0.03]">
                    <CellValue val={row.x} isX={true} />
                  </td>
                  {/* Series S value */}
                  <td className="px-5 py-4 border-b border-white/[0.03]">
                    <CellValue val={row.s} isX={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Note ── */}
        <p className="mt-8 text-[#2C2C2C] text-[11px] font-light tracking-wide">
          Both consoles support Xbox Game Pass, backward compatibility, Quick Resume, Smart Delivery, and Auto HDR.
        </p>

      </div>
    </section>
  );
}
