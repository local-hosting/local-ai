import type { EventSummary } from '../types/event-summary.js'
import type { Vocabulary } from '../types/vocabulary.js'
import type { ElevationDenyReason } from '../types/wrap.js'
import { assertElevatedInput } from './deny-list.js'

export type ElevatedComposePayload = {
  vocab: Vocabulary
  event: EventSummary
}

export type ElevateForComposeResult =
  | { ok: true; payload: ElevatedComposePayload }
  | { ok: false; reason: ElevationDenyReason }

/**
 * Elevation gate: only elevated vocab + event summaries reach compose.
 * Does not open pack stores — host elevates via feeds → packs → pattern, then calls this.
 */
export function elevateForCompose(input: {
  vocab?: Vocabulary
  event?: EventSummary
  raw_sensors?: unknown
  duckdb?: unknown
  unsealed_items?: unknown
}): ElevateForComposeResult {
  if (input.unsealed_items !== undefined) {
    return { ok: false, reason: 'unsealed_items' }
  }
  const denied = assertElevatedInput(input)
  if (denied) return { ok: false, reason: denied }
  return {
    ok: true,
    payload: { vocab: input.vocab!, event: input.event! },
  }
}
