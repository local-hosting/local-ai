# Runtime (self-boot)

| Piece | Script / entry |
|-------|----------------|
| llama-server | `runtime/start-llama.sh` |
| Wait for llama | `runtime/wait-llama.sh` |
| Full stack | `runtime/boot.sh` or `yarn start:boot` |
| Gateway only | `yarn start` |

## Mesh deploy

- `LOCAL_AI_BIND_HOST=0.0.0.0` for private network listeners
- `PORT` — gateway health + API (default `8090` dev)
- `LOCAL_AI_LLAMA_PORT` — loopback llama (default `8080`)
- Weights: `LOCAL_AI_GGUF_PATH` / `LOCAL_AI_GGUF_URL`
- Gateway auth: `LOCAL_AI_API_KEY` (Bearer)

Clients use **`POST /generate`** for unstructured chat (not OpenAI `/v1/...` on the mesh).

Env catalog: [env.md](./env.md).

Reference image: `runtime/Dockerfile`.