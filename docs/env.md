# Environment variables

All operational names use the **`LOCAL_AI_`** prefix.

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Gateway listen port | `8090` |
| `LOCAL_AI_BIND_HOST` | `127.0.0.1` or `0.0.0.0` | `127.0.0.1` |
| `LOCAL_AI_SERVICE_ID` | `GET /` metadata | `local-ai` |
| `LOCAL_AI_VERSION` | `GET /` metadata | package version |
| `LOCAL_AI_API_KEY` | Gateway Bearer auth | unset (open) |
| `LOCAL_AI_BOOT_MODE` | `GET /` metadata | unset |
| `LOCAL_AI_START_LLAMA` | `1` runs llama in `boot.sh` | `1` |
| `LOCAL_AI_LLAMA_PORT` | Loopback llama-server port | `8080` |
| `LOCAL_AI_LLAMA_BASE_URL` | Gateway → llama base URL | derived from port |
| `LOCAL_AI_COMPOSE_MODEL` | Composer name from `models/MANIFEST.json` | `chosen_composer` (Pi: `qwen3-0.6b-instruct`) |
| `LOCAL_AI_GGUF_PATH` | On-disk weights (skips MANIFEST resolve) | resolved from MANIFEST / `/models/model.gguf` in images |
| `LOCAL_AI_GGUF_URL` | First-boot download URL | unset |
| `LOCAL_AI_MODEL_ALIAS` | llama `-a` alias | derived from resolved composer |
| `LOCAL_AI_CTX_SIZE` | Context tokens | `8192` |
| `LOCAL_AI_N_PARALLEL` | llama `-np` | `1` |
| `LOCAL_AI_THREADS` | llama `-t` | cgroup / `nproc` |
| `LOCAL_AI_WEIGHTS_MODE` | `mmap` or `resident` | `mmap` |
| `LOCAL_AI_RESIDENT_GGUF_PATH` | Copy target when `resident` | `/tmp/local-ai/model.gguf` |
| `LOCAL_AI_LLAMA_API_KEY` | llama-server `--api-key` | unset |
| `LOCAL_AI_LLAMA_SERVER_BIN` | llama binary path | `/app/llama-server` |
| `LOCAL_AI_LLAMA_WAIT_SEC` | Boot wait budget | `1200` |
| `LOCAL_AI_GLINER_BASE_URL` | Mapper sidecar | `http://127.0.0.1:8091` |
| `LOCAL_AI_GLINER_PORT` | Python GLiNER bind | `8091` |
| `LOCAL_AI_GLINER_MODEL` | Hugging Face model id | `fastino/gliner2-base-v1` |
| `LOCAL_AI_COMPOSE_TIMEOUT_MS` | `/compose` timeout | `20000` |
| `LOCAL_AI_MAP_TIMEOUT_MS` | `/map/*` timeout | `1000` |
| `LOCAL_AI_GENERATE_TIMEOUT_MS` | `/generate` timeout | `600000` |
| `LOCAL_AI_ENFORCE_MANIFEST` | `1` fails boot on bad manifest | unset |
| `LOCAL_AI_LLAMA_WAIT_INTERVAL_SEC` | Poll interval during boot wait | `2` |