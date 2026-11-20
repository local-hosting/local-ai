#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

# Dev checkout: resolve from MANIFEST / LOCAL_AI_COMPOSE_MODEL when path unset.
# Images usually set LOCAL_AI_GGUF_PATH=/models/model.gguf explicitly.
if [ -z "${LOCAL_AI_GGUF_PATH:-}" ] && [ -f "$ROOT/scripts/resolve-composer.ts" ]; then
  gguf_path="$(node --import tsx "$ROOT/scripts/resolve-composer.ts" --field path)"
  if [ -z "${LOCAL_AI_MODEL_ALIAS:-}" ]; then
    alias="$(node --import tsx "$ROOT/scripts/resolve-composer.ts" --field alias)"
  else
    alias="$LOCAL_AI_MODEL_ALIAS"
  fi
else
  gguf_path="${LOCAL_AI_GGUF_PATH:-/models/model.gguf}"
  if [ -z "${LOCAL_AI_MODEL_ALIAS:-}" ] && [ -f "$ROOT/scripts/resolve-composer.ts" ]; then
    alias="$(node --import tsx "$ROOT/scripts/resolve-composer.ts" --field alias 2>/dev/null || echo local-composer)"
  else
    alias="${LOCAL_AI_MODEL_ALIAS:-local-composer}"
  fi
fi

upstream_port="${LOCAL_AI_LLAMA_PORT:-8080}"
ctx="${LOCAL_AI_CTX_SIZE:-8192}"
parallel="${LOCAL_AI_N_PARALLEL:-1}"
api_key="${LOCAL_AI_LLAMA_API_KEY:-}"
weights_mode="${LOCAL_AI_WEIGHTS_MODE:-mmap}"

resolve_thread_count() {
  if [ -n "${LOCAL_AI_THREADS:-}" ]; then
    echo "$LOCAL_AI_THREADS"
    return
  fi
  if [ -r /sys/fs/cgroup/cpu/cpu.cfs_quota_us ] && [ -r /sys/fs/cgroup/cpu/cpu.cfs_period_us ]; then
    quota="$(cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us)"
    period="$(cat /sys/fs/cgroup/cpu/cpu.cfs_period_us)"
    if [ "$quota" != "-1" ] && [ "$period" -gt 0 ] 2>/dev/null; then
      cores=$((quota / period))
      if [ "$cores" -lt 1 ]; then
        cores=1
      fi
      echo "$cores"
      return
    fi
  fi
  if [ -r /sys/fs/cgroup/cpu.max ]; then
    line="$(cat /sys/fs/cgroup/cpu.max)"
    quota="${line%% *}"
    period="${line#* }"
    if [ "$quota" != "max" ] && [ -n "$period" ] && [ "$period" -gt 0 ] 2>/dev/null; then
      cores=$((quota / period))
      if [ "$cores" -lt 1 ]; then
        cores=1
      fi
      echo "$cores"
      return
    fi
  fi
  if command -v nproc >/dev/null 2>&1; then
    nproc
    return
  fi
  echo "4"
}

threads="$(resolve_thread_count)"

if [ ! -f "$gguf_path" ]; then
  gguf_url="${LOCAL_AI_GGUF_URL:-}"
  if [ -z "$gguf_url" ]; then
    echo "local-ai: missing ${gguf_path} — set LOCAL_AI_GGUF_URL" >&2
    exit 1
  fi
  echo "local-ai: downloading GGUF to ${gguf_path}"
  mkdir -p "$(dirname "$gguf_path")"
  curl -fsSL "$gguf_url" -o "$gguf_path"
fi

llama_bin="${LOCAL_AI_LLAMA_SERVER_BIN:-/app/llama-server}"
if [ ! -x "$llama_bin" ]; then
  echo "local-ai: missing executable ${llama_bin}" >&2
  exit 1
fi

model_path="$gguf_path"
if [ "$weights_mode" = "resident" ] || [ "$weights_mode" = "copy" ]; then
  local_gguf="${LOCAL_AI_RESIDENT_GGUF_PATH:-/tmp/local-ai/model.gguf}"
  if [ "$gguf_path" != "$local_gguf" ]; then
    mkdir -p "$(dirname "$local_gguf")"
    if [ ! -f "$local_gguf" ] || [ "$gguf_path" -nt "$local_gguf" ]; then
      echo "local-ai: copying GGUF to container-local disk (${local_gguf})"
      cp -f "$gguf_path" "$local_gguf"
    fi
    model_path="$local_gguf"
  fi
fi

export LOCAL_AI_LLAMA_BASE_URL="http://127.0.0.1:${upstream_port}"

echo "local-ai: starting llama-server (alias=${alias}, ctx=${ctx}, threads=${threads}, weights=${weights_mode}, port=${upstream_port})"

set -- "$llama_bin" \
  -m "$model_path" \
  --host 127.0.0.1 \
  --port "$upstream_port" \
  -c "$ctx" \
  -np "$parallel" \
  -t "$threads" \
  -a "$alias"

if [ -n "$api_key" ]; then
  set -- "$@" --api-key "$api_key"
fi

exec "$@"