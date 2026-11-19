#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Install llama.cpp via brew (if needed): brew install llama.cpp"
yarn install
python3 -m venv services/gliner/.venv || true
# shellcheck disable=SC1091
source services/gliner/.venv/bin/activate 2>/dev/null || true
pip install -r services/gliner/requirements.txt 2>/dev/null || true

node eval/generate-samples.mjs
echo "Download GGUF files listed in models/MANIFEST.json (TODO JM URLs)"
echo "Start: llama-server, python services/gliner/app.py, yarn start"
echo "Health: curl -s http://127.0.0.1:8090/health"