import { useEffect, useState } from "react";
import { AlertTriangle, ChevronLeft, Download, Printer, Trash2 } from "lucide-react";
import { deletePiece, downloadUrl, getPiece, musicxmlUrl } from "../lib/api";
import ScoreRenderer from "./ScoreRenderer";
import SourceBadge from "./SourceBadge";

export default function ScoreView({ pieceId, onBack, onDeleted }) {
  const [piece, setPiece] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("standardized"); // standardized | original
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPiece(pieceId)
      .then((data) => !cancelled && setPiece(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [pieceId]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <BackLink onBack={onBack} />
        <p className="mt-6 text-sm text-red-700">Couldn't load this piece: {error}</p>
      </div>
    );
  }
  if (!piece) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <BackLink onBack={onBack} />
      </div>
    );
  }

  const { summary = {} } = piece;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <BackLink onBack={onBack} />
        <button
          onClick={async () => {
            if (!confirmingDelete) {
              setConfirmingDelete(true);
              return;
            }
            await deletePiece(pieceId);
            onDeleted();
          }}
          onBlur={() => setConfirmingDelete(false)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            confirmingDelete ? "bg-red-600 text-white" : "text-ink/45 hover:bg-red-50 hover:text-red-600"
          }`}
        >
          <Trash2 size={13} />
          {confirmingDelete ? "Click again to delete" : "Delete"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SourceBadge kind={piece.source_kind} />
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink">
            {piece.title}
          </h1>
          <p className="mt-1 text-sm text-ink/55">
            {[
              summary.measures ? `${summary.measures} measures` : null,
              summary.time_signature,
              summary.key_guess,
              summary.parts ? `${summary.parts} staves` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-heading text-xs font-semibold text-ink shadow-sm ring-1 ring-black/[0.06] transition-colors hover:bg-haze"
          >
            <Printer size={13} />
            Print / Save PDF
          </button>
          <DownloadMenu pieceId={pieceId} />
        </div>
      </div>

      {piece.warnings?.length > 0 && (
        <div className="mt-6 space-y-2">
          {piece.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay-dark"
            >
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {piece.has_original && (
        <div className="mt-6 inline-flex rounded-full bg-haze p-1">
          {["standardized", "original"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 font-heading text-xs font-medium capitalize transition-colors ${
                view === v ? "bg-white text-ink shadow-sm" : "text-ink/55"
              }`}
            >
              {v === "standardized" ? "Standardized" : "Your original"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/[0.03] sm:p-10">
        {view === "standardized" ? (
          <ScoreRenderer musicxmlUrl={musicxmlUrl(pieceId)} />
        ) : (
          <OriginalView piece={piece} pieceId={pieceId} />
        )}
      </div>
    </div>
  );
}

function OriginalView({ piece, pieceId }) {
  const url = downloadUrl(pieceId, "original");
  if (piece.original_ext === ".pdf") {
    return <embed src={url} type="application/pdf" className="h-[80vh] w-full rounded-lg" />;
  }
  return <img src={url} alt="Original upload" className="mx-auto max-w-full rounded-lg" />;
}

function BackLink({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1 font-heading text-sm font-medium text-ink/60 hover:text-ink"
    >
      <ChevronLeft size={16} />
      Library
    </button>
  );
}

function DownloadMenu({ pieceId }) {
  const [open, setOpen] = useState(false);
  const options = [
    { fmt: "musicxml", label: "MusicXML (.musicxml)" },
    { fmt: "mxl", label: "Compressed MusicXML (.mxl)" },
    { fmt: "midi", label: "MIDI (.mid)" },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-heading text-xs font-semibold text-paper transition-colors hover:bg-ink/85"
      >
        <Download size={13} />
        Export
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-black/[0.06]">
          {options.map((o) => (
            <a
              key={o.fmt}
              href={downloadUrl(pieceId, o.fmt)}
              className="block px-4 py-2 text-sm text-ink/80 hover:bg-haze"
            >
              {o.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
