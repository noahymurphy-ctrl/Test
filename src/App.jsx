import { useCallback, useState } from "react";
import Header from "./components/Header";
import UploadView from "./components/UploadView";
import LibraryView from "./components/LibraryView";
import ScoreView from "./components/ScoreView";
import { checkHealth } from "./lib/api";
import useInterval from "./hooks/useInterval";

export default function App() {
  const [screen, setScreen] = useState({ name: "upload" });
  const [jobs, setJobs] = useState([]);
  const [backendOk, setBackendOk] = useState(true);
  const [checkedOnce, setCheckedOnce] = useState(false);
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);

  const pollHealth = useCallback(async () => {
    try {
      await checkHealth();
      setBackendOk(true);
    } catch {
      setBackendOk(false);
    } finally {
      setCheckedOnce(true);
    }
  }, []);

  useInterval(pollHealth, 8000);

  const handleJobCreated = (job) => setJobs((prev) => [job, ...prev]);
  const handleJobSettled = (jobId, latest) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    if (latest.status === "done") setLibraryRefreshKey((k) => k + 1);
  };
  const openPiece = (pieceId) => setScreen({ name: "piece", id: pieceId });

  return (
    <div className="min-h-screen bg-paper">
      <Header screen={screen} onNavigate={setScreen} backendOk={backendOk} />

      {checkedOnce && !backendOk && (
        <div className="border-b border-red-100 bg-red-50 px-6 py-2.5 text-center text-sm text-red-700">
          Can't reach the local backend. Start it with{" "}
          <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs">
            cd server &amp;&amp; uvicorn main:app --reload
          </code>{" "}
          — see README.md.
        </div>
      )}

      {screen.name === "upload" && (
        <UploadView
          jobs={jobs}
          onJobCreated={handleJobCreated}
          onJobSettled={handleJobSettled}
          onOpenPiece={openPiece}
        />
      )}
      {screen.name === "library" && (
        <LibraryView onOpenPiece={openPiece} onNavigate={setScreen} refreshKey={libraryRefreshKey} />
      )}
      {screen.name === "piece" && (
        <ScoreView
          pieceId={screen.id}
          onBack={() => setScreen({ name: "library" })}
          onDeleted={() => {
            setLibraryRefreshKey((k) => k + 1);
            setScreen({ name: "library" });
          }}
        />
      )}
    </div>
  );
}
