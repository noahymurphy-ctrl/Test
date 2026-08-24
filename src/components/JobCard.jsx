import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { getJob } from "../lib/api";
import useInterval from "../hooks/useInterval";

function formatElapsed(startedAt) {
  const secs = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function JobCard({ job, onSettled, onOpenPiece }) {
  const [state, setState] = useState(job);
  const [settled, setSettled] = useState(false);
  const [elapsedLabel, setElapsedLabel] = useState("0s");
  const [startedAt] = useState(() => Date.now());

  useInterval(
    async () => {
      try {
        const latest = await getJob(job.id);
        setState(latest);
        if (latest.status === "done" || latest.status === "error") {
          setSettled(true);
          onSettled(job.id, latest);
        }
      } catch {
        // transient — try again next tick
      }
    },
    settled ? null : 2500
  );

  useInterval(() => setElapsedLabel(formatElapsed(startedAt)), settled ? null : 1000);

  const isDone = state.status === "done";
  const isError = state.status === "error";

  return (
    <div className="fade-in flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/[0.03]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-haze">
          {isDone && <CheckCircle2 size={17} className="text-sage" />}
          {isError && <AlertTriangle size={17} className="text-red-600" />}
          {!isDone && !isError && <Loader2 size={17} className="spinner text-clay" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-medium text-ink">
            {state.source_filename || job.filename}
          </p>
          <p className="truncate text-xs text-ink/55">
            {isError ? state.error : state.stage || "Queued"}
            {!isDone && !isError && ` · ${elapsedLabel}`}
          </p>
        </div>
      </div>

      {isDone && (
        <button
          onClick={() => onOpenPiece(state.piece_id)}
          className="shrink-0 rounded-full bg-ink px-4 py-2 font-heading text-xs font-semibold text-paper transition-colors hover:bg-ink/85"
        >
          View score
        </button>
      )}
    </div>
  );
}
