import type { ElevationDenyReason } from '../types/wrap.js'

/** Inputs that must never reach compose/map (documented + fail-fast hooks). */
export function assertElevatedInput(input: {
  vocab?: unknown
  event?: unknown
  raw_sensors?: unknown
  duckdb?: unknown
}): ElevationDenyReason | null {
  if (input.raw_sensors !== undefined) return 'raw_payload'
  if (input.duckdb !== undefined) return 'duckdb_path'
  if (!input.vocab) return 'missing_vocab'
  if (!input.event) return 'missing_candidates'
  return null
}