import { useCallback, useRef, useState } from "react";
import { AlertTriangle, FileMusic, Upload } from "lucide-react";
import { uploadFile } from "../lib/api";
import JobCard from "./JobCard";

const ACCEPT = ".png,.jpg,.jpeg,.bmp,.tif,.tiff,.webp,.pdf,.musicxml,.xml,.mxl,.mid,.midi";

export default function UploadView({ jobs, onJobCreated, onJobSettled, onOpenPiece }) {
  const [dragOver, setDragOver] = useState(false);
  const [pickError, setPickError] = useState(null);
  const inputRef = useRef(null);

  const submitFiles = useCallback(
    async (fileList) => {
      setPickError(null);
      for (const file of Array.from(fileList)) {
        try {
          const { job_id } = await uploadFile(file);
          onJobCreated({ id: job_id, filename: file.name, status: "queued", stage: "Queued" });
        } catch (err) {
          setPickError(err.message || "Upload failed");
        }
      }
    },
    [onJobCreated]
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Turn any sheet music into a fair copy
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-ink/65">
          Upload a photo, scan, or PDF of piano sheet music — or a MusicXML,
          MXL, or MIDI file — and get back one clean, standardized score,
          engraved neatly and ready to export.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) submitFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-8 py-16 text-center transition-colors ${
          dragOver ? "border-clay bg-clay/5" : "border-mist/50 bg-white"
        }`}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-haze">
          <Upload size={22} className="text-ink/70" />
        </div>
        <p className="font-heading text-base font-medium text-ink">
          Drop sheet music here
        </p>
        <p className="mt-1 text-sm text-ink/55">or</p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-full bg-clay px-6 py-2.5 font-heading text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
        >
          Choose a file
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) submitFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-6 text-xs text-ink/45">
          Images (PNG/JPG), PDF scans, MusicXML, MXL, or MIDI &middot; 60&nbsp;MB max
        </p>
      </div>

      {pickError && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{pickError}</span>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="mt-10 space-y-3">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-ink/50">
            In progress
          </h2>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onSettled={onJobSettled} onOpenPiece={onOpenPiece} />
          ))}
        </div>
      )}

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        <InfoCard
          icon={<FileMusic size={18} className="text-sage" />}
          title="Already digital? It's exact"
          body="MusicXML, MXL, and MIDI files are parsed from their exact data — no guessing, no misread notes. We just re-typeset them cleanly."
        />
        <InfoCard
          icon={<AlertTriangle size={18} className="text-clay-dark" />}
          title="Photos take real recognition"
          body="Scans and photos go through optical music recognition. It's good, not infallible — always check the result against your original."
        />
        <InfoCard
          icon={<Upload size={18} className="text-sky" />}
          title="Runs on your Mac"
          body="Recognition runs locally in the background server, so a dense page can take a few minutes. Feel free to keep working while it finishes."
        />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, body }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.03]">
      <div className="mb-3">{icon}</div>
      <h3 className="font-heading text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{body}</p>
    </div>
  );
}
