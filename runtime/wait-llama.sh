#!/bin/sh
set -eu

port="${LOCAL_AI_LLAMA_PORT:-8080}"
max_wait="${LOCAL_AI_LLAMA_WAIT_SEC:-1200}"
interval="${LOCAL_AI_LLAMA_WAIT_INTERVAL_SEC:-2}"
elapsed=0

echo "local-ai: waiting for llama-server on :${port} (max ${max_wait}s)"
while [ "$elapsed" -lt "$max_wait" ]; do
  if curl -fsS "http://127.0.0.1:${port}/health" >/dev/null 2>&1; then
    echo "local-ai: llama-server ready"
    exit 0
  fi
  sleep "$interval"
  elapsed=$((elapsed + interval))
done

echo "local-ai: llama-server did not become healthy within ${max_wait}s" >&2
exit 1