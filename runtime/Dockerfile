# Reference image: llama-server + local-ai gateway (mesh-ready).
# Build context: local-ai repo root. Requires YARN_NPM_AUTH_TOKEN for @local-hosting/*.

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json yarn.lock* .yarnrc.yml ./
RUN corepack enable && corepack prepare yarn@4.18.1 --activate
RUN yarn install
COPY . .
RUN yarn build
RUN chmod +x runtime/boot.sh runtime/start-llama.sh runtime/wait-llama.sh

FROM ghcr.io/ggml-org/llama.cpp:server

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=build /app /app/local-ai

ENV LOCAL_AI_BIND_HOST=0.0.0.0
ENV LOCAL_AI_LLAMA_PORT=11435
ENV LOCAL_AI_BOOT_MODE=full
ENV PORT=11434
ENV LOCAL_AI_GGUF_PATH=/models/model.gguf
ENV LOCAL_AI_MODEL_ALIAS=qwen2.5-7b
ENV LOCAL_AI_CTX_SIZE=8192
ENV LOCAL_AI_N_PARALLEL=1
ENV LOCAL_AI_WEIGHTS_MODE=mmap

WORKDIR /app/local-ai
EXPOSE 11434

HEALTHCHECK --interval=30s --timeout=10s --start-period=1200s --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1

CMD ["/bin/sh", "/app/local-ai/runtime/boot.sh"]