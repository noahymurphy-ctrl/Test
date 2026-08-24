import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

// Renders a MusicXML file into fully engraved, standardized notation —
// this is the "nice and neat" payoff: whatever the source looked like,
// everything that reaches this component comes out typeset the same way.
export default function ScoreRenderer({ musicxmlUrl }) {
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatus("loading");
      setError(null);
      try {
        const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");
        if (cancelled) return;
        if (!osmdRef.current && containerRef.current) {
          osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
            autoResize: true,
            backend: "svg",
            drawTitle: true,
            drawComposer: true,
            drawPartNames: false,
            drawingParameters: "compacttight",
          });
        }
        await osmdRef.current.load(musicxmlUrl);
        if (cancelled) return;
        osmdRef.current.render();
        if (!cancelled) setStatus("ready");
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || String(e));
          setStatus("error");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [musicxmlUrl]);

  return (
    <div>
      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink/55">
          <Loader2 size={16} className="spinner" />
          Typesetting your score…
        </div>
      )}
      {status === "error" && (
        <div className="rounded-xl bg-red-50 px-4 py-4 text-sm text-red-700">
          Couldn't render this score: {error}
        </div>
      )}
      <div ref={containerRef} className="score-canvas print-area" />
    </div>
  );
}
