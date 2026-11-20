"""
GLiNER2 sidecar — loopback only. Falls back to lexicon from shared map-catalog.json.
"""
from __future__ import annotations

import json
import os
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any

HOST = "127.0.0.1"
PORT = int(os.environ.get("LOCAL_AI_GLINER_PORT", "8091"))
CONFIDENCE_FLOOR = 0.5
MODEL_ID = os.environ.get("LOCAL_AI_GLINER_MODEL", "fastino/gliner2-base-v1")

_CATALOG_PATH = (
    Path(__file__).resolve().parents[2] / "src" / "map" / "map-catalog.json"
)


def _load_catalog() -> dict[str, Any]:
    with _CATALOG_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


CATALOG = _load_catalog()
QUESTION_LABELS: list[str] = list(CATALOG["question_labels"])
REPORT_TYPES: list[str] = list(CATALOG["report_types"])
_CONF = CATALOG["lexicon_confidence"]


def _compile_question_patterns() -> list[tuple[str, re.Pattern[str]]]:
    patterns: list[tuple[str, re.Pattern[str]]] = []
    raw: dict[str, list[str]] = CATALOG["question_patterns"]
    for label in QUESTION_LABELS:
        if label == "other":
            continue
        for source in raw.get(label, []):
            flags = re.I if re.search(r"[A-Za-z]", source) else 0
            patterns.append((label, re.compile(source, flags)))
    return patterns


QUESTION_PATTERNS = _compile_question_patterns()

_GLINER: Any = None
_GLINER2_OK = False


def _load_gliner() -> None:
    global _GLINER, _GLINER2_OK
    try:
        from gliner2 import GLiNER2

        _GLINER = GLiNER2.from_pretrained(MODEL_ID)
        _GLINER2_OK = True
        print(f"gliner2 loaded: {MODEL_ID}")
    except Exception as exc:  # noqa: BLE001 — keep sidecar up on load failure
        _GLINER = None
        _GLINER2_OK = False
        print(f"gliner2 unavailable ({exc!r}); lexicon fallback")


def map_question_lexicon(text: str) -> dict[str, Any]:
    for label, pattern in QUESTION_PATTERNS:
        if pattern.search(text):
            return {"label": label, "confidence": float(_CONF["question_hit"])}
    return {"label": "other", "confidence": float(_CONF["question_miss"])}


def _pick_label(result: dict[str, Any], task: str, labels: list[str]) -> tuple[str, float]:
    """Best label + confidence from classify_text output."""
    block = result.get(task, result)
    if isinstance(block, str):
        return (block if block in labels else "other", 0.7)
    if isinstance(block, dict):
        if "labels" in block and "scores" in block:
            pairs = list(zip(block["labels"], block["scores"]))
            if pairs:
                label, score = max(pairs, key=lambda p: float(p[1]))
                return (str(label) if str(label) in labels else "other", float(score))
        scored = [
            (k, float(v))
            for k, v in block.items()
            if k in labels and isinstance(v, (int, float))
        ]
        if scored:
            label, score = max(scored, key=lambda p: p[1])
            return label, score
        for key in ("label", "classification", "class"):
            if key in block and str(block[key]) in labels:
                return str(block[key]), float(block.get("confidence", block.get("score", 0.7)))
    if isinstance(block, list) and block:
        first = block[0]
        if isinstance(first, str) and first in labels:
            return first, 0.7
        if isinstance(first, dict):
            lab = str(first.get("label", first.get("text", "")))
            score = float(first.get("confidence", first.get("score", 0.7)))
            return (lab if lab in labels else "other", score)
    return "other", 0.4


def map_question(text: str) -> dict[str, Any]:
    if _GLINER2_OK and _GLINER is not None:
        try:
            result = _GLINER.classify_text(
                text,
                {"question": QUESTION_LABELS},
                threshold=CONFIDENCE_FLOOR,
                include_confidence=True,
            )
            label, confidence = _pick_label(result, "question", QUESTION_LABELS)
            return {"label": label, "confidence": confidence}
        except Exception as exc:  # noqa: BLE001
            print(f"gliner2 classify question failed: {exc!r}")
    return map_question_lexicon(text)


def _place_match(text: str, vocab: dict[str, Any]) -> str | None:
    text_l = text.lower()
    for place in vocab.get("places", []):
        labels = place.get("labels", {})
        for _lang, label in labels.items():
            if label and label.lower() in text_l:
                return place["id"]
    return None


def _event_match(text: str, vocab: dict[str, Any]) -> str | None:
    text_l = text.lower()
    for event in vocab.get("events", []):
        for _lang, label in event.get("labels", {}).items():
            if label and label.lower() in text_l:
                return event["id"]
    return None


def map_report_lexicon(text: str, vocab: dict[str, Any]) -> dict[str, Any]:
    text_l = text.lower()
    report_type = "other"
    for cue in CATALOG["report_cues"]:
        cue_type = cue["type"]
        if "all" in cue:
            if all(token.lower() in text_l for token in cue["all"]):
                report_type = cue_type
                break
        elif "any" in cue:
            if any(token.lower() in text_l for token in cue["any"]):
                report_type = cue_type
                break

    place_id = _place_match(text, vocab)
    event_ref = _event_match(text, vocab)

    confidence = (
        float(_CONF["report_hit"]) if report_type != "other" else float(_CONF["report_miss"])
    )
    if confidence < CONFIDENCE_FLOOR and report_type != "other":
        report_type = "other"
    return {
        "report_type": report_type,
        "event_ref": event_ref,
        "place_id": place_id,
        "confidence": confidence,
    }


def _entity_id_from_vocab(
    text: str,
    vocab: dict[str, Any],
    kind: str,
) -> str | None:
    """Match extracted entity strings back to vocab ids via labels."""
    if not _GLINER2_OK or _GLINER is None:
        return _place_match(text, vocab) if kind == "places" else _event_match(text, vocab)

    entries = vocab.get(kind, [])
    label_to_id: dict[str, str] = {}
    for entry in entries:
        eid = entry.get("id")
        if not eid:
            continue
        for _lang, label in (entry.get("labels") or {}).items():
            if label:
                label_to_id[label.lower()] = eid

    if not label_to_id:
        return None

    try:
        extracted = _GLINER.extract_entities(text, list({*label_to_id.keys(), kind[:-1]}))
        entities = extracted.get("entities", extracted) if isinstance(extracted, dict) else {}
        if isinstance(entities, dict):
            for _etype, values in entities.items():
                for value in values if isinstance(values, list) else [values]:
                    key = str(value).lower()
                    if key in label_to_id:
                        return label_to_id[key]
                    for label, eid in label_to_id.items():
                        if label in key or key in label:
                            return eid
    except Exception as exc:  # noqa: BLE001
        print(f"gliner2 entity extract failed: {exc!r}")

    return _place_match(text, vocab) if kind == "places" else _event_match(text, vocab)


def map_report(text: str, vocab: dict[str, Any]) -> dict[str, Any]:
    if _GLINER2_OK and _GLINER is not None:
        try:
            result = _GLINER.classify_text(
                text,
                {"report": REPORT_TYPES},
                threshold=CONFIDENCE_FLOOR,
                include_confidence=True,
            )
            report_type, confidence = _pick_label(result, "report", REPORT_TYPES)
            place_id = _entity_id_from_vocab(text, vocab, "places")
            event_ref = _entity_id_from_vocab(text, vocab, "events")
            if confidence < CONFIDENCE_FLOOR and report_type != "other":
                report_type = "other"
            return {
                "report_type": report_type,
                "event_ref": event_ref,
                "place_id": place_id,
                "confidence": confidence,
            }
        except Exception as exc:  # noqa: BLE001
            print(f"gliner2 classify report failed: {exc!r}")
    return map_report_lexicon(text, vocab)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:
        return

    def _json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/health":
            self._json(
                200,
                {
                    "ok": True,
                    "service": "gliner-sidecar",
                    "gliner2": _GLINER2_OK,
                    "model": MODEL_ID if _GLINER2_OK else None,
                    "catalog": str(_CATALOG_PATH.name),
                },
            )
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8")
        try:
            body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return

        if self.path == "/map/question":
            text = body.get("text", "")
            result = map_question(text)
            if result["confidence"] < CONFIDENCE_FLOOR:
                result = {"label": "other", "confidence": result["confidence"]}
            self._json(200, result)
            return

        if self.path == "/map/report":
            vocab = body.get("vocab") or {}
            text = body.get("text", "")
            self._json(200, map_report(text, vocab))
            return

        self._json(404, {"error": "not found"})


def main() -> None:
    _load_gliner()
    server = HTTPServer((HOST, PORT), Handler)
    print(f"gliner sidecar on http://{HOST}:{PORT} gliner2={_GLINER2_OK} catalog={_CATALOG_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
