# Elevation wrap

Hosts elevate raw inputs before compose. This package only accepts **IDs-only** vocab + event summaries.

**Elevation (host-side):** raw → offline stores → packs → aggregate → signal → pattern → trend → **ai**.

**Deny-list (never send to models):** raw sensors, Parquet, DB paths, unsealed item dumps, free-text corpora.

## Pack items (this package shapes; host writes)

| `item_kind` | Pack (typical) | Role |
|---|---|---|
| `community_ai_vocab` | `community-ai` | Vocab extract + symbol codes (fat sync) |
| `community_compose_intent` | `community-compose` | Elevated compose output (IDs only) |
| `community_compose_rating` | `community-compose` | Accuracy loop ratings |

Builders: `src/wrap/community-pack-items.ts`. Gate: `elevateForCompose` (`src/wrap/elevate-for-compose.ts`).

Demo: `maybeRulesOnly` stub + fixtures. Live pack writes stay in the host — **no SDK shims in this repo**.

## Thin pipe vs fat pipe

- **Fat pipe (Wi‑Fi / USB / pack sync):** full vocab + intent + rating items.
- **Thin pipe:** host pack-announce + compact symbol frames from pack rows (`src/wire/pack-delta.ts`) — never unsealed dumps.
- Vocab packs do **not** go over the thin pipe; peers already share the tip **fingerprint** from fat sync (`need_heal` if missing).
