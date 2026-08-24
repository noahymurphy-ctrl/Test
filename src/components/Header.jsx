import { Library, Upload } from "lucide-react";

export default function Header({ screen, onNavigate, backendOk }) {
  return (
    <header className="border-b border-haze bg-paper/90 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <button
          className="flex items-center gap-2.5 group"
          onClick={() => onNavigate({ name: "upload" })}
        >
          <svg width="30" height="30" viewBox="0 0 64 64" className="shrink-0">
            <rect width="64" height="64" rx="14" fill="#141413" />
            <path d="M24 40 V17 L44 12 V35" fill="none" stroke="#faf9f5" strokeWidth="3.6" strokeLinecap="round" />
            <path d="M24 17 L44 12 V17 L24 22 Z" fill="#d97757" />
            <circle cx="20" cy="41" r="6.2" fill="#faf9f5" />
            <circle cx="40" cy="36" r="6.2" fill="#d97757" />
          </svg>
          <span className="font-heading text-lg font-semibold tracking-tight text-ink">
            Fair Copy
          </span>
        </button>

        <nav className="flex items-center gap-1">
          <button
            onClick={() => onNavigate({ name: "upload" })}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-heading text-sm font-medium transition-colors ${
              screen.name === "upload"
                ? "bg-ink text-paper"
                : "text-ink/70 hover:bg-haze"
            }`}
          >
            <Upload size={15} />
            Upload
          </button>
          <button
            onClick={() => onNavigate({ name: "library" })}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-heading text-sm font-medium transition-colors ${
              screen.name === "library" || screen.name === "piece"
                ? "bg-ink text-paper"
                : "text-ink/70 hover:bg-haze"
            }`}
          >
            <Library size={15} />
            Library
          </button>
          {!backendOk && (
            <span
              title="Can't reach the local backend — start it with the instructions in README.md"
              className="ml-2 hidden items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Backend offline
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
