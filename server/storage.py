"""Local, file-based storage for converted pieces. Everything lives under
../data (gitignored) — data/library/<piece_id>/ per piece, data/tmp/ for
scratch work during conversion. No database: for a single-user local app,
a folder per piece plus a meta.json is plenty, and it stays trivially
inspectable/movable/backupable in Finder."""

from __future__ import annotations

import json
import shutil
import uuid
from pathlib import Path
from typing import Any, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
LIBRARY_DIR = DATA_DIR / "library"
TMP_DIR = DATA_DIR / "tmp"

LIBRARY_DIR.mkdir(parents=True, exist_ok=True)
TMP_DIR.mkdir(parents=True, exist_ok=True)


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def piece_dir(piece_id: str) -> Path:
    return LIBRARY_DIR / piece_id


def new_tmp_dir(job_id: str) -> Path:
    d = TMP_DIR / job_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def cleanup_tmp_dir(job_id: str) -> None:
    shutil.rmtree(TMP_DIR / job_id, ignore_errors=True)


def save_meta(piece_id: str, meta: dict[str, Any]) -> None:
    d = piece_dir(piece_id)
    d.mkdir(parents=True, exist_ok=True)
    (d / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")


def load_meta(piece_id: str) -> Optional[dict[str, Any]]:
    p = piece_dir(piece_id) / "meta.json"
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def list_pieces() -> list[dict[str, Any]]:
    pieces = []
    for meta_path in LIBRARY_DIR.glob("*/meta.json"):
        try:
            pieces.append(json.loads(meta_path.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError):
            continue
    pieces.sort(key=lambda m: m.get("created_at", ""), reverse=True)
    return pieces


def delete_piece(piece_id: str) -> bool:
    d = piece_dir(piece_id)
    if not d.exists():
        return False
    shutil.rmtree(d)
    return True


def piece_file(piece_id: str, filename: str) -> Optional[Path]:
    p = piece_dir(piece_id) / filename
    return p if p.exists() else None
