"""Command-line interface the Fair Copy Mac app drives via Process.

Deliberately stateless: it converts one input file into one output
directory and reports what it did. The app owns the library on disk
(Application Support), so nothing here needs to know about it.

Every line written to stdout is a single self-contained JSON object, so
the app can read progress line-by-line as it streams:

    {"event": "stage",  "message": "Recognizing notes…"}
    {"event": "done",   "summary": {...}, "warnings": [...]}
    {"event": "error",  "message": "..."}

Subcommands:
    doctor                      check this Python has what it needs
    convert INPUT --out-dir DIR convert one file
"""

from __future__ import annotations

import argparse
import json
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))


def emit(obj: dict) -> None:
    """Write one JSON line and flush, so the app sees progress live."""
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def stage(message: str) -> None:
    emit({"event": "stage", "message": message})


# No .heic here on purpose: OpenCV (which oemer reads images with) can't
# decode HEIC. The Mac app converts HEIC to PNG natively before calling us.
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}
PDF_EXTS = {".pdf"}
MUSICXML_EXTS = {".musicxml", ".xml"}
MXL_EXTS = {".mxl"}
MIDI_EXTS = {".mid", ".midi"}
ALL_EXTS = IMAGE_EXTS | PDF_EXTS | MUSICXML_EXTS | MXL_EXTS | MIDI_EXTS

REQUIRED_MODULES = [
    ("music21", "music21"),
    ("pymupdf", "PyMuPDF"),
    ("onnx", "onnx"),
    ("onnxruntime", "onnxruntime"),
    ("oemer", "oemer"),
]


def classify(path: Path) -> str | None:
    ext = path.suffix.lower()
    if ext in IMAGE_EXTS:
        return "image"
    if ext in PDF_EXTS:
        return "pdf"
    if ext in MXL_EXTS:
        return "mxl"
    if ext in MUSICXML_EXTS:
        return "musicxml"
    if ext in MIDI_EXTS:
        return "midi"
    return None


def cmd_doctor(_args) -> int:
    """Report whether this interpreter can actually do the work, so the app
    can show a real setup screen instead of failing on first conversion."""
    missing: list[str] = []
    for module_name, pip_name in REQUIRED_MODULES:
        try:
            __import__(module_name)
        except Exception:
            missing.append(pip_name)

    checkpoints_present = False
    try:
        import oemer

        ckpt = Path(oemer.__file__).resolve().parent / "checkpoints" / "unet_big" / "model.onnx"
        checkpoints_present = ckpt.exists()
    except Exception:
        pass

    emit(
        {
            "event": "doctor",
            "ok": not missing,
            "python_version": ".".join(str(v) for v in sys.version_info[:3]),
            "python_path": sys.executable,
            "missing": missing,
            # Recognition models download themselves on first use (~110 MB);
            # surfacing this lets the app warn that run #1 will be slower.
            "models_downloaded": checkpoints_present,
        }
    )
    return 0 if not missing else 1


def cmd_convert(args) -> int:
    import convert as convert_mod
    import omr as omr_mod

    src = Path(args.input).expanduser().resolve()
    out_dir = Path(args.out_dir).expanduser().resolve()

    if not src.exists():
        emit({"event": "error", "message": f"No such file: {src}"})
        return 1

    kind = classify(src)
    if kind is None:
        emit(
            {
                "event": "error",
                "message": f"Unsupported file type '{src.suffix}'. "
                f"Supported: {', '.join(sorted(ALL_EXTS))}",
            }
        )
        return 1

    out_dir.mkdir(parents=True, exist_ok=True)
    work_dir = out_dir / "_work"
    warnings: list[str] = []

    try:
        if kind == "image":
            page = omr_mod.recognize_image(src, work_dir, on_stage=stage)
            warnings += page.warnings
            stage("Reading the recognized score")
            score = convert_mod.parse_score(page.musicxml_path)

        elif kind == "pdf":
            stage("Rendering PDF pages")
            page_images = omr_mod.rasterize_pdf(src, work_dir / "pages")
            scores = []
            for i, img in enumerate(page_images):
                stage(f"Recognizing page {i + 1} of {len(page_images)}")
                result = omr_mod.recognize_image(img, work_dir / f"page-{i + 1}", on_stage=stage)
                warnings += [f"Page {i + 1}: {w}" for w in result.warnings]
                scores.append(convert_mod.parse_score(result.musicxml_path))

            stage("Combining pages")
            try:
                score, merge_warnings = convert_mod.merge_pages(scores)
                warnings += merge_warnings
            except convert_mod.MergeIncompatible as e:
                warnings.append(
                    f"Couldn't safely combine {len(scores)} pages into one continuous "
                    f"score ({e}); only page 1 is shown. Convert the other pages "
                    "separately for now."
                )
                score = scores[0]

        else:  # musicxml / mxl / midi — exact symbolic data, no recognition
            stage("Reading the file")
            score = convert_mod.parse_score(src)
            if kind == "midi":
                warnings.append(
                    "This came from a MIDI file, which doesn't encode notated rhythm, "
                    "beaming, or note spelling directly — those were inferred "
                    "automatically and may not match your intent exactly."
                )

        stage("Writing the standardized score")
        musicxml_path = out_dir / "score.musicxml"
        convert_mod.write_musicxml(score, musicxml_path)
        convert_mod.write_mxl(musicxml_path.read_text(encoding="utf-8"), out_dir / "score.mxl")

        try:
            convert_mod.write_midi(score, out_dir / "score.mid")
        except Exception:
            warnings.append("Couldn't produce a MIDI export for this score.")

        summary = convert_mod.score_summary(score)
        if kind in ("image", "pdf") and not summary.get("time_signature"):
            warnings.append(
                "No time signature was recognized, so the barlines may not reflect "
                "the original meter — worth checking against your original."
            )

        emit({"event": "done", "kind": kind, "summary": summary, "warnings": warnings})
        return 0

    except Exception as e:
        emit({"event": "error", "message": str(e) or e.__class__.__name__, "detail": traceback.format_exc()})
        return 1
    finally:
        import shutil

        shutil.rmtree(work_dir, ignore_errors=True)


def main() -> int:
    parser = argparse.ArgumentParser(prog="faircopy", description="Fair Copy conversion engine")
    subs = parser.add_subparsers(dest="command", required=True)

    subs.add_parser("doctor", help="Check that this Python can run conversions")

    conv = subs.add_parser("convert", help="Convert one file")
    conv.add_argument("input")
    conv.add_argument("--out-dir", required=True)

    args = parser.parse_args()
    if args.command == "doctor":
        return cmd_doctor(args)
    return cmd_convert(args)


if __name__ == "__main__":
    sys.exit(main())
