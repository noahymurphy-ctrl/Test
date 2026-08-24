"""Image / PDF -> MusicXML, via the `oemer` optical music recognition engine."""

from __future__ import annotations

import logging
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

from omr_patch import ensure_patched, is_known_houghlines_error, is_known_negative_pads_error

logger = logging.getLogger("fair_copy.omr")

OMR_TIMEOUT_SECONDS = 30 * 60  # a dense, full-page scan on a CPU can take a while


class OMRError(RuntimeError):
    pass


@dataclass
class PageResult:
    page_number: int
    musicxml_path: Path
    warnings: list[str] = field(default_factory=list)


def _oemer_command() -> list[str]:
    """Prefer the console script installed alongside the running interpreter
    (correct even inside a venv) and fall back to whatever's on PATH."""
    candidate = Path(sys.executable).parent / "oemer"
    if candidate.exists():
        return [str(candidate)]
    return ["oemer"]


def _run_oemer_once(image_path: Path, out_dir: Path, without_deskew: bool) -> subprocess.CompletedProcess:
    cmd = _oemer_command() + [str(image_path), "-o", str(out_dir)]
    if without_deskew:
        cmd.append("--without-deskew")
    logger.info("Running: %s", " ".join(cmd))
    return subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=OMR_TIMEOUT_SECONDS,
    )


def _find_output_musicxml(out_dir: Path, image_stem: str) -> Path:
    # oemer names its output after the input image (e.g. "page1.musicxml").
    direct = out_dir / f"{image_stem}.musicxml"
    if direct.exists():
        return direct
    candidates = sorted(out_dir.glob("*.musicxml"), key=lambda p: p.stat().st_mtime, reverse=True)
    if candidates:
        return candidates[0]
    raise OMRError("oemer reported success but produced no .musicxml file")


def recognize_image(image_path: Path, out_dir: Path, *, on_stage=None) -> PageResult:
    """Run OMR on a single raster image. Returns the produced MusicXML path.

    Self-heals a known upstream checkpoint bug (see omr_patch.py) and retries
    once without deskewing if the first attempt fails outright, since a mild
    camera skew is one of the more common real-world failure causes.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    warnings: list[str] = []

    if on_stage:
        on_stage("Preparing recognition models")
    ensure_patched()

    if on_stage:
        on_stage("Detecting staves and symbols (this is the slow step)")
    result = _run_oemer_once(image_path, out_dir, without_deskew=False)

    if result.returncode != 0 and (
        is_known_negative_pads_error(result.stderr) or is_known_houghlines_error(result.stderr)
    ):
        logger.warning("Hit a known oemer bug mid-run; patching and retrying once")
        if on_stage:
            on_stage("Applying a one-time model fix and retrying")
        ensure_patched()
        result = _run_oemer_once(image_path, out_dir, without_deskew=False)

    if result.returncode != 0:
        logger.warning("First OMR attempt failed, retrying without deskew:\n%s", result.stderr[-2000:])
        if on_stage:
            on_stage("Retrying without auto-deskew")
        retry = _run_oemer_once(image_path, out_dir, without_deskew=True)
        if retry.returncode == 0:
            warnings.append(
                "Automatic de-skewing failed on this page, so it was recognized "
                "without correcting for camera tilt. Check the result carefully "
                "if the original photo wasn't shot straight-on."
            )
            result = retry
        else:
            tail = (retry.stderr or result.stderr)[-4000:]
            raise OMRError(f"oemer could not process this page:\n{tail}")

    musicxml_path = _find_output_musicxml(out_dir, image_path.stem)
    return PageResult(page_number=1, musicxml_path=musicxml_path, warnings=warnings)


def rasterize_pdf(pdf_path: Path, out_dir: Path, dpi: int = 300) -> list[Path]:
    """Render each page of a PDF to a high-resolution PNG for OMR input."""
    import pymupdf  # PyMuPDF ("fitz" is its older, now-deprecated import name)

    out_dir.mkdir(parents=True, exist_ok=True)
    pages: list[Path] = []
    zoom = dpi / 72.0
    matrix = pymupdf.Matrix(zoom, zoom)
    with pymupdf.open(str(pdf_path)) as doc:
        if doc.page_count == 0:
            raise OMRError("That PDF has no pages")
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=matrix, colorspace=pymupdf.csRGB)
            page_path = out_dir / f"page-{i + 1:03d}.png"
            pix.save(str(page_path))
            pages.append(page_path)
    return pages
