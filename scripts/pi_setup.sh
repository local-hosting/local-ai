#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Build llama.cpp for ARM64 (see llama.cpp docs)"
yarn install
python3 -m venv services/gliner/.venv
# shellcheck disable=SC1091
source services/gliner/.venv/bin/activate
pip install -r services/gliner/requirements.txt 2>/dev/null || true
node eval/generate-samples.mjs
echo "After models on disk: TF_ENFORCE_MANIFEST=1 yarn start"