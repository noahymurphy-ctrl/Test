"""Fair Copy backend — FastAPI app.

Run from inside server/ with the venv active:
    uvicorn main:app --reload --port 8000

See ../README.md for full setup instructions.
"""

from __future__ import annotations

import logging
import shutil
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse

import convert
import omr
import storage

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("fair_copy.main")

app = FastAPI(title="Fair Copy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}
PDF_EXTS = {".pdf"}
MUSICXML_EXTS = {".musicxml", ".xml"}
MXL_EXTS = {".mxl"}
MIDI_EXTS = {".mid", ".midi"}
ALL_EXTS = IMAGE_EXTS | PDF_EXTS | MUSICXML_EXTS | MXL_EXTS | MIDI_EXTS

MAX_UPLOAD_BYTES = 60 * 1024 * 1024  # 60 MB

_executor = ThreadPoolExecutor(max_workers=2)
_jobs: dict[str, dict] = {}
_lock = Lock()


def _classify(filename: str) -> Optional[str]:
    ext = Path(filename).suffix.lower()
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


@app.get("/api/health")
def health():
    omr_available = True
    omr_detail = "ready"
    try:
        import oemer  # noqa: F401
    except Exception as e:  # pragma: no cover - environment dependent
        omr_available = False
        omr_detail = f"oemer not importable: {e}"
    return {
        "status": "ok",
        "omr_available": omr_available,
        "omr_detail": omr_detail,
    }


@app.post("/api/convert")
async def convert_upload(file: UploadFile = File(...)):
    kind = _classify(file.filename or "")
    if kind is None:
        allowed = ", ".join(sorted(ALL_EXTS))
        raise HTTPException(400, f"Unsupported file type. Supported: {allowed}")

    job_id = storage.new_id()
    job_dir = storage.new_tmp_dir(job_id)
    dest = job_dir / f"upload{Path(file.filename).suffix.lower()}"

    size = 0
    with dest.open("wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                storage.cleanup_tmp_dir(job_id)
                raise HTTPException(413, "File is too large (60 MB max)")
            out.write(chunk)

    with _lock:
        _jobs[job_id] = {
            "id": job_id,
            "status": "queued",
            "stage": "Queued",
            "error": None,
            "piece_id": None,
            "source_filename": file.filename,
        }

    _executor.submit(_process_job, job_id, dest, file.filename, kind)
    return {"job_id": job_id}


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    with _lock:
        job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(404, "Unknown job")
    return job


@app.get("/api/library")
def library():
    return storage.list_pieces()


@app.get("/api/library/{piece_id}")
def get_piece(piece_id: str):
    meta = storage.load_meta(piece_id)
    if meta is None:
        raise HTTPException(404, "Piece not found")
    return meta


@app.get("/api/library/{piece_id}/musicxml")
def get_piece_musicxml(piece_id: str):
    f = storage.piece_file(piece_id, "score.musicxml")
    if f is None:
        raise HTTPException(404, "Piece not found")
    return PlainTextResponse(f.read_text(encoding="utf-8"), media_type="application/vnd.recordare.musicxml+xml")


_DOWNLOADS = {
    "musicxml": ("score.musicxml", "application/vnd.recordare.musicxml+xml", ".musicxml"),
    "mxl": ("score.mxl", "application/vnd.recordare.musicxml", ".mxl"),
    "midi": ("score.mid", "audio/midi", ".mid"),
}


@app.get("/api/library/{piece_id}/download/{fmt}")
def download_piece(piece_id: str, fmt: str):
    meta = storage.load_meta(piece_id)
    if meta is None:
        raise HTTPException(404, "Piece not found")

    if fmt == "original":
        ext = meta.get("original_ext")
        if not meta.get("has_original") or not ext:
            raise HTTPException(404, "No original file was stored for this piece")
        f = storage.piece_file(piece_id, f"original{ext}")
        if f is None:
            raise HTTPException(404, "Original file missing")
        name = f"{meta['title']}-original{ext}"
        return FileResponse(f, filename=name)

    if fmt not in _DOWNLOADS:
        raise HTTPException(400, "Unknown format")
    filename, media_type, out_ext = _DOWNLOADS[fmt]
    f = storage.piece_file(piece_id, filename)
    if f is None:
        raise HTTPException(404, f"No {fmt} file for this piece")
    name = f"{meta['title']}{out_ext}"
    return FileResponse(f, filename=name, media_type=media_type)


@app.delete("/api/library/{piece_id}")
def delete_piece(piece_id: str):
    if not storage.delete_piece(piece_id):
        raise HTTPException(404, "Piece not found")
    return {"deleted": piece_id}


def _process_job(job_id: str, upload_path: Path, original_filename: str, source_kind: str) -> None:
    def set_stage(message: str) -> None:
        with _lock:
            if job_id in _jobs:
                _jobs[job_id]["stage"] = message
        logger.info("[%s] %s", job_id, message)

    with _lock:
        _jobs[job_id]["status"] = "processing"
    warnings: list[str] = []

    try:
        if source_kind == "image":
            set_stage("Recognizing notes from the image")
            work = storage.new_tmp_dir(f"{job_id}-omr")
            page = omr.recognize_image(upload_path, work, on_stage=set_stage)
            warnings += page.warnings
            set_stage("Reading the recognized score")
            score = convert.parse_score(page.musicxml_path)

        elif source_kind == "pdf":
            work = storage.new_tmp_dir(f"{job_id}-omr")
            set_stage("Rendering PDF pages to images")
            page_images = omr.rasterize_pdf(upload_path, work / "pages")
            scores = []
            for i, img in enumerate(page_images):
                set_stage(f"Recognizing page {i + 1} of {len(page_images)}")
                page_result = omr.recognize_image(img, work / f"page-{i + 1}-out", on_stage=set_stage)
                warnings += [f"Page {i + 1}: {w}" for w in page_result.warnings]
                scores.append(convert.parse_score(page_result.musicxml_path))

            set_stage("Combining pages into one score")
            try:
                score, merge_warnings = convert.merge_pages(scores)
                warnings += merge_warnings
            except convert.MergeIncompatible as e:
                warnings.append(
                    f"Couldn't safely combine {len(scores)} pages into one continuous score "
                    f"({e}); showing page 1 only. Convert the other pages separately for now."
                )
                score = scores[0]

        elif source_kind in ("musicxml", "mxl", "midi"):
            set_stage("Reading the file")
            score = convert.parse_score(upload_path)
            if source_kind == "midi":
                warnings.append(
                    "This came from a MIDI file, which doesn't encode notated rhythm, beaming, "
                    "or note spelling directly — those were inferred automatically below and "
                    "may not match your intent exactly."
                )
        else:
            raise ValueError(f"Unsupported source kind: {source_kind}")

        set_stage("Writing the standardized score")
        piece_id = storage.new_id()
        pdir = storage.piece_dir(piece_id)
        pdir.mkdir(parents=True, exist_ok=True)

        musicxml_path = pdir / "score.musicxml"
        convert.write_musicxml(score, musicxml_path)
        musicxml_text = musicxml_path.read_text(encoding="utf-8")
        convert.write_mxl(musicxml_text, pdir / "score.mxl")

        try:
            convert.write_midi(score, pdir / "score.mid")
        except Exception:
            logger.exception("[%s] MIDI export failed", job_id)

        has_original = source_kind in ("image", "pdf")
        original_ext = None
        if has_original:
            original_ext = upload_path.suffix.lower()
            shutil.copy(upload_path, pdir / f"original{original_ext}")

        summary = convert.score_summary(score)
        if source_kind in ("image", "pdf") and not summary.get("time_signature"):
            warnings.append(
                "No time signature was recognized, so barlines below may not "
                "reflect the original meter — check it against your original."
            )

        # For OMR sources, oemer stamps a placeholder title from whatever temp
        # filename it was handed (not a real extracted title, and not useful) —
        # the original upload's filename is the more meaningful fallback there.
        # For already-digital sources, an embedded <movement-title> is real
        # metadata and worth preferring.
        fallback_title = Path(original_filename).stem
        title = fallback_title if source_kind in ("image", "pdf") else (summary.get("title") or fallback_title)

        meta = {
            "id": piece_id,
            "title": title,
            "source_filename": original_filename,
            "source_kind": source_kind,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "summary": summary,
            "warnings": warnings,
            "has_original": has_original,
            "original_ext": original_ext,
        }
        storage.save_meta(piece_id, meta)

        with _lock:
            _jobs[job_id]["status"] = "done"
            _jobs[job_id]["piece_id"] = piece_id
            _jobs[job_id]["stage"] = "Done"

    except Exception as e:
        logger.exception("[%s] Job failed", job_id)
        with _lock:
            _jobs[job_id]["status"] = "error"
            _jobs[job_id]["error"] = str(e) or e.__class__.__name__
    finally:
        storage.cleanup_tmp_dir(job_id)
        storage.cleanup_tmp_dir(f"{job_id}-omr")
