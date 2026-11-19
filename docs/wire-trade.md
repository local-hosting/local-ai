# Wire trade

**Fat pipe (Wi‑Fi/USB/pack sync):** GGUF, full vocab labels, community pack items (snapshot bodies).

**Thin pipe:** symbol + **vocab tip (content fingerprint)** + compact codes — expand/compress via `@local-hosting/compose` (`src/expand/`); helpers in `src/wire/`. Pack rows → air via `src/wire/pack-delta.ts` (host pack store remains source of truth).

- Simulation envelope: `symbol + base + hex` (`base` = tip fingerprint)
- Pack announce (spatial-ai): `peer>>pack@<fingerprint>::…` — tip id aligns with thin `vocab_base`
- Intent body: symbol `4` + tip + compact action/place/actor codes
- Rating fields: `itemId^rating=not_here^event_id=…` (from `community_compose_rating` pack item)

Crosswalk + packed codecs live in `@local-hosting/compose`. Pack-announce grammar stays in spatial-ai.

## Fat / thin tip contract

| | Fat | Thin |
|--|-----|------|
| Carries | Full vocab snapshot (ids, codes, labels) | Tip fingerprint + codes |
| Tip id | Snapshot / pack keyed by **fingerprint** (`fp-` + 16 hex) | `CompactFrame.vocab_base` **is** that fingerprint |
| Announce | Body sync | Pack-announce `version` = fingerprint |
| Heal | Import missing snapshot | Expand returns `need_heal { fingerprint }` |
| Human label | `vocab_version` / `snapshot.label` (display only) | Never the lock |

## Local box symbol table

Each local box **maintains**:

1. **Community vocab pack** in the community pack store — string ids + labels (`SUPPORTED_LANGUAGES` from `@local-hosting/compose`: ar, en, es, fr, he, hi, it, nl, pt, ta, zh-Hans, zh-Hant).
2. **`VocabStore` frontier** (`vocabularyToVocabStore`) — one or more tips; encode with `active`; decode via `expandWithStore`.
3. **`LocalSymbolTablePack`** view (`vocabularyToSymbolTable`) — `vocab_base` = content fingerprint of entries.

**Over any thin pipe (LoRa / BT / WSS / …):** symbol + tip + codes. Peers expand via shared frontier from fat sync. Vocab authors assign codes when publishing; tips change when the entry set changes.
