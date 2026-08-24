import { useEffect, useState } from "react";
import { Library as LibraryIcon, Upload } from "lucide-react";
import { listLibrary } from "../lib/api";
import PieceCard from "./PieceCard";

export default function LibraryView({ onOpenPiece, onNavigate, refreshKey }) {
  const [pieces, setPieces] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listLibrary()
      .then((data) => !cancelled && setPieces(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink">
        Your library
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Every score you've converted, standardized and ready to export.
      </p>

      {error && (
        <p className="mt-6 text-sm text-red-700">Couldn't load your library: {error}</p>
      )}

      {pieces && pieces.length === 0 && (
        <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-mist/50 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-haze">
            <LibraryIcon size={20} className="text-ink/50" />
          </div>
          <p className="font-heading text-sm font-medium text-ink">Nothing here yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink/55">
            Converted scores will show up here.
          </p>
          <button
            onClick={() => onNavigate({ name: "upload" })}
            className="mt-5 flex items-center gap-1.5 rounded-full bg-clay px-5 py-2.5 font-heading text-sm font-semibold text-white"
          >
            <Upload size={14} />
            Upload sheet music
          </button>
        </div>
      )}

      {pieces && pieces.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pieces.map((piece) => (
            <PieceCard key={piece.id} piece={piece} onOpen={onOpenPiece} />
          ))}
        </div>
      )}
    </div>
  );
}
