#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
START_LLAMA="${LOCAL_AI_START_LLAMA:-1}"

if [ "$START_LLAMA" = "1" ]; then
  /bin/sh "$ROOT/runtime/start-llama.sh" &
  llama_pid=$!
  trap 'kill "$llama_pid" 2>/dev/null || true' EXIT INT TERM
  /bin/sh "$ROOT/runtime/wait-llama.sh"
fi

export LOCAL_AI_BOOT_MODE="${LOCAL_AI_BOOT_MODE:-full}"
if [ -z "${LOCAL_AI_VERSION:-}" ] && [ -f "$ROOT/package.json" ]; then
  LOCAL_AI_VERSION="$(node --input-type=module -e "import fs from 'node:fs'; process.stdout.write(JSON.parse(fs.readFileSync('${ROOT}/package.json','utf8')).version)")"
fi
export LOCAL_AI_VERSION="${LOCAL_AI_VERSION:-0.0.0}"

if [ -f "$ROOT/dist/src/api/start-server.js" ]; then
  exec node "$ROOT/dist/src/api/start-server.js"
fi

exec node --import tsx "$ROOT/src/api/start-server.ts"