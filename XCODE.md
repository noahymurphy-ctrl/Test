# Fair Copy — the native Mac app

A SwiftUI macOS app in `FairCopy.xcodeproj` + `FairCopy/`. Same conversion
engine as the web version (`FairCopy/Resources/engine/`), driven directly
as a subprocess — no web server involved. Drag sheet music in, get a
cleanly engraved, standardized score out, export MusicXML / MXL / MIDI /
PDF.

## Requirements

- **Xcode 16 or newer** (the project uses Xcode 16's folder-synchronized
  project format). macOS 14+ to run the app.
- **Python 3.10+ somewhere on the Mac** — Homebrew (`brew install python`)
  or [python.org](https://www.python.org/downloads/). The app's first-run
  setup finds it automatically and builds its own private environment
  from it; after that it isn't touched. (Xcode's own `/usr/bin/python3`
  is 3.9, which is too old for the music libraries — the app knows this
  and will tell you rather than fail cryptically.)

## Run it

```bash
git pull
open FairCopy.xcodeproj
```

Press **⌘R**. That's it — the app is configured to sign locally
("Sign to Run Locally"), so no team or provisioning setup is needed.

First launch walks you through a one-time engine setup (≈500 MB into
`~/Library/Application Support/FairCopy/`, nothing outside it), with the
installer's real output streaming in the window. After that: drop a
photo, scan, PDF, MusicXML, MXL, or MIDI file anywhere on the upload
screen. iPhone HEIC photos are fine — the app converts them itself.

Two honest expectations, same as the web version:

- The **first photo/PDF conversion** also downloads the recognition
  models (~110 MB), one time.
- **Recognition is CPU-real work** — minutes per dense page, with live
  stage updates in the sidebar. MusicXML/MXL/MIDI conversions are
  seconds, and exact.

## Where things live

| Path | What |
| --- | --- |
| `FairCopy/` | Swift sources (views, services), auto-synced into the target |
| `FairCopy/Resources/engine/` | The Python engine: `cli.py` + recognition/convert modules |
| `FairCopy/Resources/viewer/` | The score renderer (OpenSheetMusicDisplay + viewer.html) shown in a WKWebView |
| `~/Library/Application Support/FairCopy/venv` | The app-managed Python environment |
| `~/Library/Application Support/FairCopy/library` | Your converted pieces (one folder per piece, plain files + meta.json) |

The app is deliberately **not sandboxed** (no entitlements file): it has
to spawn its Python engine, read the files you drop on it, and download
models/packages on setup. That's also why this is a run-it-yourself
developer build rather than something App Store-shaped.

## Troubleshooting

**The project won't open / Xcode reports it as damaged.** This project
file was written by hand (authored in a Linux environment where Xcode
can't verify it). If your Xcode rejects it, the 2-minute rebuild:

1. File → New → Project → macOS → App. Name **FairCopy**, interface
   SwiftUI, language Swift. Save it anywhere *outside* this repo.
2. In the new project, delete the template's `ContentView.swift` and
   `FairCopyApp.swift`, then drag this repo's `FairCopy` folder from
   Finder into the project navigator. Choose **"Copy items if needed"
   OFF**, and reference or group style is fine — just make sure
   "Add to target: FairCopy" is checked.
3. In the target's Signing & Capabilities tab, remove the App Sandbox
   capability. In Build Settings set the deployment target to macOS 14.0.
4. ⌘R.

**"No Python 3.10+ found" during setup.** Install one
(`brew install python`), then click Try Again. The installer checks
Homebrew paths, python.org framework installs, and `/usr/bin/python3`,
in that order.

**Engine setup fails mid-`pip install`.** The full log is right there in
the window (selectable text). The usual suspects are no network, or `git`
missing — `git` comes with Xcode, so that one mostly means the Xcode
command line tools install is incomplete (`xcode-select --install`).

**A photo conversion fails.** The engine retries once without
de-skewing automatically. If it still fails, the error surfaces in the
sidebar row for that file. A straighter, flatter, better-lit photo
genuinely helps — recognition quality is bounded by photo quality.

**Where's my data if I trash the app?** Everything is plain files in
`~/Library/Application Support/FairCopy/` — delete that folder and it's
all gone; copy `library/` out and you've backed up every conversion.
