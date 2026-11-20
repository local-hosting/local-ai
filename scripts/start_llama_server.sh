#!/usr/bin/env bash
set -euo pipefail
# Local helper — resolves GGUF from MANIFEST / LOCAL_AI_COMPOSE_MODEL unless LOCAL_AI_GGUF_PATH is set.
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

if [ -n "${LOCAL_AI_GGUF_PATH:-}" ]; then
  MODEL="$LOCAL_AI_GGUF_PATH"
  ALIAS="${LOCAL_AI_MODEL_ALIAS:-$(node --import tsx "$ROOT/scripts/resolve-composer.ts" --field alias)}"
else
  MODEL="$(node --import tsx "$ROOT/scripts/resolve-composer.ts" --field path)"
  ALIAS="${LOCAL_AI_MODEL_ALIAS:-$(node --import tsx "$ROOT/scripts/resolve-composer.ts" --field alias)}"
fi

PORT="${LOCAL_AI_LLAMA_PORT:-8080}"
CTX="${LOCAL_AI_CTX_SIZE:-4096}"
THREADS="${LOCAL_AI_THREADS:-6}"
BIN="${LOCAL_AI_LLAMA_SERVER_BIN:-llama-server}"

exec "$BIN" -m "$MODEL" --host 127.0.0.1 --port "$PORT" -c "$CTX" -np 1 -t "$THREADS" -a "$ALIAS"
