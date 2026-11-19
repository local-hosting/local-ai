/** Simulation-style: symbol + base + hex payload */
export type { SymbolEnvelope } from '@local-hosting/compose'

/** Minimal compose intent on air (compact codes when available). */
export type IntentFrame = {
  kind: 'intent'
  vocab_base: string
  event_code: number
  band: 1 | 2 | 3 | 4
  actor_codes: number[]
  action_codes: number[]
  place_codes: number[]
}

/** Host pack-announcement frame (sync adapters — not @local-hosting/compose). */
export type PackDeltaUpdate = {
  itemId: string
  fields: Record<string, string | number>
}

export type PackDeltaFrame = {
  peer: string
  pack: string
  version: string
  seq: number
  itemCount: number
  updates?: PackDeltaUpdate[]
  dropItemId?: string
}
