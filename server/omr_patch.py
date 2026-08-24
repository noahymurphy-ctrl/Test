"""
Fixes a real compatibility bug in oemer's published `unet_big` checkpoint.

That checkpoint was exported to ONNX years ago and encodes its up-sampling
(ConvTranspose) layers with a *negative* `pads` value — a legal trick under
the ONNX spec (for ConvTranspose, pads are subtracted from the computed
output size, so a negative pad grows it by one pixel to hit an exact
2x upsample). Recent onnxruntime releases added stricter validation that
rejects negative pads outright, so the checkpoint fails to load with:

    Op (ConvTranspose) [ShapeInferenceError] Attribute pads must not
    contain negative values

This is not a code bug on our side, and not a GPU/CPU issue — it fails
identically on every platform and execution provider, discovered by
reproducing it end-to-end (see the project's PR description / commit
history for how this was diagnosed). The fix: clamp each offending
ConvTranspose's pads to zero (its natural, one-pixel-smaller output), then
append an explicit `Pad` node that zero-pads that missing pixel back on —
mathematically the same result, expressed in a form modern onnxruntime
accepts. Applied once, cached on disk (it edits the checkpoint file
in place), safe to call every time the app starts.
"""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger("fair_copy.omr_patch")

# All four offending nodes sit in a decoder block that runs NCHW internally
# (confirmed by inspecting the bias/skip-connection tensor shapes feeding
# each one), even though the graph's overall input/output is NHWC. Spatial
# axes there are 2 and 3.
_NCHW_SPATIAL_AXES = (2, 3)


def _find_unet_big_checkpoint() -> Path | None:
    try:
        import oemer
    except ImportError:
        return None
    module_path = Path(oemer.__file__).resolve().parent
    onnx_path = module_path / "checkpoints" / "unet_big" / "model.onnx"
    return onnx_path


def _has_negative_pads(model) -> bool:
    for node in model.graph.node:
        if node.op_type != "ConvTranspose":
            continue
        for attr in node.attribute:
            if attr.name == "pads" and any(v < 0 for v in attr.ints):
                return True
    return False


def _patch_model(model) -> int:
    from onnx import helper

    graph = model.graph
    new_nodes = []
    patched = 0

    for node in list(graph.node):
        if node.op_type != "ConvTranspose":
            new_nodes.append(node)
            continue

        pads_attr = next((a for a in node.attribute if a.name == "pads"), None)
        if pads_attr is None or not any(v < 0 for v in pads_attr.ints):
            new_nodes.append(node)
            continue

        pads = list(pads_attr.ints)  # [beginH, beginW, endH, endW]
        begin, end = pads[:2], pads[2:]
        clamped_pads = [max(0, v) for v in begin] + [max(0, v) for v in end]
        grow_begin = [max(0, -v) for v in begin]
        grow_end = [max(0, -v) for v in end]

        del pads_attr.ints[:]
        pads_attr.ints.extend(clamped_pads)
        new_nodes.append(node)
        patched += 1

        if any(grow_begin) or any(grow_end):
            orig_output = node.output[0]
            pregrow_name = f"{orig_output}__pregrow"
            node.output[0] = pregrow_name

            ax0, ax1 = _NCHW_SPATIAL_AXES
            full_pads = [0, 0, 0, 0, 0, 0, 0, 0]
            full_pads[ax0] = grow_begin[0]
            full_pads[ax1] = grow_begin[1]
            full_pads[4 + ax0] = grow_end[0]
            full_pads[4 + ax1] = grow_end[1]

            new_nodes.append(
                helper.make_node(
                    "Pad",
                    inputs=[pregrow_name],
                    outputs=[orig_output],
                    name=f"{node.name}__grow_fix",
                    mode="constant",
                    pads=full_pads,
                    value=0.0,
                )
            )

    del graph.node[:]
    graph.node.extend(new_nodes)
    return patched


def ensure_checkpoint_patched(onnx_path: Path | None = None) -> bool:
    """Patch oemer's unet_big checkpoint in place if it still has the bug.

    Returns True if a patch was applied, False if no checkpoint was found
    yet (not downloaded) or it was already fine. Safe to call repeatedly.
    """
    import onnx

    path = onnx_path or _find_unet_big_checkpoint()
    if path is None or not path.exists():
        return False

    model = onnx.load(str(path))
    if not _has_negative_pads(model):
        return False

    patched = _patch_model(model)
    onnx.checker.check_model(model)
    onnx.save(model, str(path))
    logger.info("Patched %d incompatible ConvTranspose node(s) in %s", patched, path)
    return True


def ensure_patched() -> None:
    """Apply every known, self-contained fix for oemer's installed package.
    Cheap and idempotent — safe to call before every recognition job."""
    try:
        ensure_checkpoint_patched()
    except Exception:
        logger.exception("Checkpoint patch check failed (continuing anyway)")
    try:
        ensure_bbox_patched()
    except Exception:
        logger.exception("bbox.py patch check failed (continuing anyway)")


def is_known_negative_pads_error(stderr_text: str) -> bool:
    return "pads must not contain negative values" in stderr_text


def is_known_houghlines_error(stderr_text: str) -> bool:
    return "find_lines" in stderr_text and "invalid index to scalar variable" in stderr_text


# ---------------------------------------------------------------------------
# Second upstream bug: oemer/bbox.py's find_lines() assumes cv2.HoughLinesP
# always returns an (N, 1, 4) array and does `line = line[0]` before indexing
# line[0..3]. On real-world (non-toy) photos this sometimes comes back
# shaped (N, 4) instead, so that `line[0]` extracts a bare number rather
# than a 4-tuple, and the very next `line[0]` crashes with:
#   IndexError: invalid index to scalar variable
# Reproduced end-to-end on a real phone-photographed piano score. The fix
# just normalizes the array shape before indexing — same logic, robust to
# either shape OpenCV happens to hand back.
_BBOX_MARKER = "# fair-copy: shape-normalized"


def _find_lines_source_path() -> Path | None:
    try:
        import oemer
    except ImportError:
        return None
    return Path(oemer.__file__).resolve().parent / "bbox.py"


def ensure_bbox_patched() -> bool:
    path = _find_lines_source_path()
    if path is None or not path.exists():
        return False

    text = path.read_text(encoding="utf-8")
    if _BBOX_MARKER in text:
        return False  # already patched

    old = (
        "    lines = cv2.HoughLinesP(data.astype(np.uint8), 1, np.pi/180, 50, None, min_len, max_gap)\n"
        "    new_line = []\n"
        "    if lines is not None:\n"
        "        for line in lines:\n"
        "            line = line[0]\n"
    )
    new = (
        f"    {_BBOX_MARKER}\n"
        "    lines = cv2.HoughLinesP(data.astype(np.uint8), 1, np.pi/180, 50, None, min_len, max_gap)\n"
        "    new_line = []\n"
        "    if lines is not None:\n"
        "        for line in np.asarray(lines).reshape(-1, 4):\n"
    )
    if old not in text:
        logger.warning(
            "oemer/bbox.py didn't match the expected source for the known "
            "HoughLinesP shape bug (upstream may have changed) — skipping "
            "that patch and leaving it as-is."
        )
        return False

    path.write_text(text.replace(old, new), encoding="utf-8")
    logger.info("Patched %s for the HoughLinesP shape bug", path)
    return True
