// Source-kind badge. Color communicates how much to trust the notes:
// green/blue = parsed from exact symbolic data (can't misread a pitch),
// amber = went through image recognition, worth a careful look.
const KIND_INFO = {
  image: { label: "Photo / scan", color: "bg-clay/15 text-clay-dark" },
  pdf: { label: "PDF scan", color: "bg-clay/15 text-clay-dark" },
  musicxml: { label: "MusicXML", color: "bg-sage/15 text-sage" },
  mxl: { label: "MusicXML", color: "bg-sage/15 text-sage" },
  midi: { label: "MIDI", color: "bg-sky/15 text-sky" },
};

export default function SourceBadge({ kind }) {
  const info = KIND_INFO[kind] || { label: kind, color: "bg-haze text-ink/60" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-heading font-medium ${info.color}`}
    >
      {info.label}
    </span>
  );
}
