"""
GLiNER2 sidecar — loopback only. Falls back to lexicon when GLiNER unavailable.
"""
from __future__ import annotations

import os
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any

HOST = "127.0.0.1"
PORT = int(os.environ.get("TF_GLINER_PORT", "8091"))
CONFIDENCE_FLOOR = 0.5

QUESTION_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("where_to_go", re.compile(r"where can i go|where is safe|où puis-je aller|adónde puedo ir", re.I)),
    ("what_to_do", re.compile(r"what should i do|que dois-je faire|qué debo hacer", re.I)),
    ("how_long", re.compile(r"how long|combien de temps|cuánto tiempo", re.I)),
    ("is_it_safe_for_kids", re.compile(r"kids|children|school|enfants|escuela|niños", re.I)),
    ("is_it_safe_outside", re.compile(r"go out|work outside|dehors|afuera|sortir", re.I)),
]


def map_question(text: str) -> dict[str, Any]:
    for label, pattern in QUESTION_PATTERNS:
        if pattern.search(text):
            return {"label": label, "confidence": 0.82}
    return {"label": "other", "confidence": 0.4}


def _place_match(text: str, vocab: dict[str, Any]) -> str | None:
    text_l = text.lower()
    for place in vocab.get("places", []):
        labels = place.get("labels", {})
        for _lang, label in labels.items():
            if label and label.lower() in text_l:
                return place["id"]
    return None


def map_report(text: str, vocab: dict[str, Any]) -> dict[str, Any]:
    text_l = text.lower()
    report_type = "other"
    if "worse" in text_l or "pire" in text_l or "peor" in text_l:
        report_type = "worse_here"
    elif "better" in text_l or "mieux" in text_l or "mejor" in text_l:
        report_type = "better_here"
    elif "sensor" in text_l and "broken" in text_l:
        report_type = "sensor_broken"
    elif "help" in text_l or "aide" in text_l or "ayuda" in text_l:
        report_type = "need_help"
    elif "safe" in text_l or "sûr" in text_l or "seguro" in text_l:
        report_type = "im_safe"

    place_id = _place_match(text, vocab)
    event_ref = None
    for event in vocab.get("events", []):
        for _lang, label in event.get("labels", {}).items():
            if label and label.lower() in text_l:
                event_ref = event["id"]
                break

    confidence = 0.75 if report_type != "other" else 0.45
    if confidence < CONFIDENCE_FLOOR and report_type != "other":
        report_type = "other"
    return {
        "report_type": report_type,
        "event_ref": event_ref,
        "place_id": place_id,
        "confidence": confidence,
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:
        return

    def _json(self, status: int, payload: dict[str, Any]) -> None:
        import json

        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/health":
            self._json(200, {"ok": True, "service": "gliner-sidecar", "gliner2": False})
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:
        import json

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
    server = HTTPServer((HOST, PORT), Handler)
    print(f"gliner sidecar on http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()