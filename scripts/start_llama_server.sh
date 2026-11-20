#!/usr/bin/env bash
set -euo pipefail
# Example — adjust model path after download
MODEL="${LOCAL_AI_GGUF_PATH:-models/gemma-4-e2b-q4_k_m.gguf}"
exec llama-server -m "$MODEL" --host 127.0.0.1 --port 8080