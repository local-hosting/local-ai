/** Simulation-style: symbol + base + hex payload */
export type { SymbolEnvelope } from '@local-hosting/compose'
import type { IntentBody } from '@local-hosting/compose'
export type { IntentBody }

/** Compose intent on air — wire `IntentBody` + vocab tip. */
export type IntentFrame = IntentBody & {
  vocab_base: string
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
