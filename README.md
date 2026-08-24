# Fair Copy

Upload piano sheet music — a photo, a scan, a PDF, or an existing
MusicXML/MXL/MIDI file — and get back one clean, standardized score:
properly engraved notation you can view, print, and export as MusicXML,
compressed MXL, or MIDI.

Everything runs on your own Mac. Nothing is uploaded anywhere else.

**It comes in two flavors sharing one conversion engine:**

- **The native Mac app** (`FairCopy.xcodeproj`) — open in Xcode, press
  ⌘R, and it handles its own setup. **This is the main one; see
  [XCODE.md](XCODE.md).**
- **The web version** (this README, below) — a React frontend + FastAPI
  backend you run from a terminal. Same engine, same results, useful if
  you'd rather not involve Xcode.

## How accurate is this, really?

Worth being upfront about, since it's the whole point of the app:

- **MusicXML, MXL, and MIDI uploads are exact.** These formats already
  encode the precise notes — there's no recognition step, just re-typesetting
  into a clean, standard layout. Nothing here can misread a pitch.
- **Photos, scans, and PDFs go through real optical music recognition**
  (OMR), using [`oemer`](https://github.com/BreezeWhite/oemer), an
  open-source, deep-learning OMR engine trained on Western music notation.
  It's genuinely good on a clean, straight-on scan of a typeset score — but
  OMR is not a solved problem anywhere in the industry, free or paid. Expect
  occasional missed accidentals, wrong octaves in dense chords, or rhythm
  slips on messy handwriting or an off-angle phone photo. **Always check the
  result against your original** — the app shows both side by side for
  exactly this reason — and treat the export as a very good first draft you
  can finish tidying up in something like [MuseScore](https://musescore.org)
  (free) if needed, the same way commercial OMR tools (PhotoScore, SmartScore)
  expect you to.
- The app surfaces what it can about its own uncertainty (e.g. it tells you
  when pages couldn't be safely combined, or when a MIDI import needed its
  rhythm guessed) rather than silently producing something that looks more
  authoritative than it is.

## Setup (macOS)

You need [Node.js](https://nodejs.org) 18+ and Python 3.10+. Check with
`node -v` and `python3 --version`; if `git` isn't already on your machine,
macOS will prompt you to install the Xcode Command Line Tools the first
time something needs it below.

```bash
# 1. Frontend dependencies
npm install

# 2. Backend: a virtual environment + dependencies
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

That backend install pulls in `oemer` straight from GitHub rather than
PyPI — the PyPI release hard-depends on `onnxruntime-gpu`, which has no
macOS build at all (no CUDA on a Mac), so a plain `pip install oemer`
fails outright there. Installing from GitHub gets you the version that
correctly uses plain `onnxruntime` on macOS, with Apple's CoreML backend
accelerating recognition on Apple Silicon.

## Running it

Two terminals — one for each half:

```bash
# Terminal 1
cd server && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Or, in one terminal, once the venv above exists:

```bash
npm run dev:all
```

**The first time you convert a photo/scan/PDF**, the backend downloads
oemer's model checkpoints (a few hundred MB) — that can take several
minutes depending on your connection, one time only. It also applies two
small, automatic, one-time fixes to those checkpoints for compatibility
with current `onnxruntime` (see "About those patches" below) — nothing
you need to do, just know it's not stuck if the very first conversion
takes a while.

**Recognizing a page is genuinely slow-ish** — it's a couple of deep
segmentation models plus classical image analysis, running locally on
your CPU (or CoreML on Apple Silicon). Budget a few minutes per page,
more for a dense, multi-staff piece. The app shows live progress and an
elapsed timer so it's clear it's still working.

## About those patches

`server/omr_patch.py` fixes two real, reproducible bugs in oemer's
published checkpoint/code that otherwise make it fail on current
`onnxruntime`, discovered by actually running the pipeline end-to-end on
a real (dense, phone-photographed) piece rather than assuming it would
work:

1. The `unet_big` checkpoint encodes its up-sampling layers with a
   negative ONNX `pads` value — legal under the ONNX spec for
   `ConvTranspose` (pads are subtracted from the computed output size, so
   a small negative pad is how the original export hits an exact 2x
   upsample), but recent `onnxruntime` releases reject negative pads
   outright. The fix clamps the pads to zero and appends an explicit
   zero-`Pad` node that reproduces the same output size — mathematically
   identical, expressed in a form modern `onnxruntime` accepts.
2. `oemer/bbox.py`'s `find_lines()` assumes `cv2.HoughLinesP` always
   returns an `(N, 1, 4)` array; on real-world (non-toy) images it can
   come back `(N, 4)` instead, crashing with
   `IndexError: invalid index to scalar variable`. The fix just
   normalizes the array shape before indexing.

Both patches are applied automatically (idempotently — safe to run every
time) before recognition, and the backend also detects these exact
failure signatures mid-run and retries once if either patch was somehow
still needed. If oemer ever ships a fixed release, these patches simply
become no-ops.

## Project layout

```
src/               React frontend (Vite + Tailwind, Claude/Anthropic brand style)
server/            Python (FastAPI) backend
  main.py          API + the conversion job pipeline
  omr.py           image/PDF -> MusicXML via oemer
  omr_patch.py      the compatibility fixes above
  convert.py       MusicXML/MXL/MIDI parsing, normalizing, multi-page merge, export
  storage.py       local file-based library (data/library/<id>/)
data/              gitignored — your converted library + scratch files live here
```

## Known limitations

- **Multi-page PDFs**: each page is recognized separately, then stitched
  together only if every page came back with the same number of staves.
  If a page is misdetected badly enough to change that count, pages are
  kept separate rather than risk silently scrambling the merge — you'll
  see a warning explaining that when it happens.
- **MIDI import**: MIDI has no notion of notated rhythm, beaming, or
  enharmonic spelling — those are inferred automatically (via
  [music21](https://web.mit.edu/music21/)) and may not match your intent.
- No built-in note editor. For fixing OMR mistakes, export MusicXML and
  use a real notation editor (MuseScore is free and opens it directly).
- PDF export goes through your browser's print dialog ("Print / Save PDF"
  in the score view) rather than a server-rendered PDF — the on-screen
  engraving is already print-quality vector SVG, so this keeps the
  backend simple without a Lilypond/MuseScore install.
