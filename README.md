# @local-hosting/ai

**Local AI** inference core: constrained **compose** (llama.cpp) and **map** (GLiNER sidecar), TypeScript-first. Elevation and vocab are upstream; this service accepts **IDs-only** elevated payloads.

## Ports (loopback)

| Service | URL |
|---|---|
| Gateway | `http://127.0.0.1:8090` |
| llama-server | `http://127.0.0.1:8080` |
| GLiNER sidecar | `http://127.0.0.1:8091` |

## Commands

From the **local-hosting** workspace root:

```bash
yarn install
yarn workspace @local-hosting/ai typecheck
yarn workspace @local-hosting/ai test
yarn workspace @local-hosting/ai start
```

Or from this package after a root `yarn install`:

```bash
yarn typecheck && yarn test && yarn start
node services/gliner/app.py
yarn eval
```

See `docs/` for elevate wrap, wire trade, ratings, adapters, and `OPEN_ITEMS.md`.

Depends on **`@local-hosting/compose`** (languages + text→frame + re-exported wire codecs). Graph: `ai → compose → wire`. Do not import `@local-hosting/wire` directly.