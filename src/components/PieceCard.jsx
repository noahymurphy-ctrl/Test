import { Music2 } from "lucide-react";
import SourceBadge from "./SourceBadge";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export default function PieceCard({ piece, onOpen }) {
  const { summary = {} } = piece;
  return (
    <button
      onClick={() => onOpen(piece.id)}
      className="group flex flex-col items-start rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-black/[0.03] transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-3 flex w-full items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-haze text-ink/60">
          <Music2 size={16} />
        </div>
        <SourceBadge kind={piece.source_kind} />
      </div>
      <h3 className="font-heading text-sm font-semibold text-ink line-clamp-2">
        {piece.title}
      </h3>
      <p className="mt-1 text-xs text-ink/50">{formatDate(piece.created_at)}</p>
      <p className="mt-3 text-xs text-ink/55">
        {summary.measures ? `${summary.measures} measures` : ""}
        {summary.time_signature ? ` · ${summary.time_signature}` : ""}
        {summary.key_guess ? ` · ${summary.key_guess}` : ""}
      </p>
      {piece.warnings?.length > 0 && (
        <p className="mt-2 text-xs font-medium text-clay-dark">
          {piece.warnings.length} note{piece.warnings.length > 1 ? "s" : ""} to review
        </p>
      )}
    </button>
  );
}
