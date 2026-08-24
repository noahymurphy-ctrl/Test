"""Normalizing already-digital notation (MusicXML / MXL / MIDI), merging
multi-page OMR results, and exporting to the formats the app offers for
download. Everything here works with exact, symbolic note data — there's
no recognition step, so nothing here can "get a note wrong" the way OMR
can; it can only reformat/re-typeset faithfully."""

from __future__ import annotations

import copy
import logging
import zipfile
from pathlib import Path

from music21 import converter, stream

logger = logging.getLogger("fair_copy.convert")


class MergeIncompatible(Exception):
    pass


def parse_score(path: Path):
    """Parse any music21-supported file (.musicxml/.xml/.mxl/.mid/.midi)."""
    return converter.parse(str(path))


def merge_pages(scores: list) -> tuple[object, list[str]]:
    """Concatenate several single-page scores (e.g. one per PDF page) into
    one continuous piece, part-by-part, measure-by-measure.

    Falls back to raising MergeIncompatible if the pages don't look like
    they belong to the same layout (different part counts) rather than
    guessing — a wrong merge would silently scramble the music, which is
    worse than just keeping pages separate.
    """
    if len(scores) == 1:
        return scores[0], []

    part_counts = [len(s.parts) for s in scores]
    if len(set(part_counts)) != 1:
        raise MergeIncompatible(
            f"pages were recognized with different numbers of staves ({part_counts}); "
            "merging them could scramble the music"
        )

    n_parts = part_counts[0]
    merged = stream.Score()
    if scores[0].metadata is not None:
        merged.metadata = copy.deepcopy(scores[0].metadata)

    for part_idx in range(n_parts):
        merged_part = stream.Part()
        merged_part.id = scores[0].parts[part_idx].id or f"P{part_idx + 1}"
        next_measure_number = 1
        for score in scores:
            src_part = score.parts[part_idx]
            for m in src_part.getElementsByClass(stream.Measure):
                new_measure = copy.deepcopy(m)
                new_measure.number = next_measure_number
                next_measure_number += 1
                merged_part.append(new_measure)
        merged.insert(0, merged_part)

    return merged, []


def score_summary(score) -> dict:
    """A few honest, checkable facts about the recognized/parsed score, so
    a user can sanity-check the result at a glance (e.g. against the
    measure count printed on their original sheet music)."""
    parts = score.parts if score.parts else [score]
    n_measures = len(parts[0].getElementsByClass(stream.Measure)) if parts else 0
    note_count = len(score.recurse().notes)

    key_guess = None
    try:
        key_guess = str(score.analyze("key"))
    except Exception:
        pass

    time_sig = None
    try:
        ts = score.recurse().getElementsByClass("TimeSignature")
        if ts:
            time_sig = ts[0].ratioString
    except Exception:
        pass

    title = None
    try:
        if score.metadata and score.metadata.title:
            title = score.metadata.title
    except Exception:
        pass

    return {
        "title": title,
        "parts": len(parts),
        "measures": n_measures,
        "notes": note_count,
        "key_guess": key_guess,
        "time_signature": time_sig,
    }


def write_musicxml(score, out_path: Path) -> None:
    score.write("musicxml", fp=str(out_path))


def write_mxl(musicxml_text: str, out_path: Path, xml_filename: str = "score.musicxml") -> None:
    """Zip plain MusicXML into the standard compressed .mxl container."""
    container_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<container>\n"
        "  <rootfiles>\n"
        f'    <rootfile full-path="{xml_filename}"/>\n'
        "  </rootfiles>\n"
        "</container>\n"
    )
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("META-INF/container.xml", container_xml)
        zf.writestr(xml_filename, musicxml_text)


def write_midi(score, out_path: Path) -> None:
    score.write("midi", fp=str(out_path))
