import type { EventSummary } from './event-summary.js'
import type { Vocabulary } from './vocabulary.js'

export type ComposeRequest = {
  vocab: Vocabulary
  event: EventSummary
}

export type PerActorIntent = {
  actor_id: string
  severity: 1 | 2 | 3 | 4
  action_ids: string[]
  place_ids?: string[]
  resource_ids?: string[]
}

export type ModelProvenance = {
  name: string
  params: string
  quant: string
  gguf_sha256: string
  adapter: string | null
}

export type ComposeIntent = {
  event_id: string
  event_ref: string
  per_actor: PerActorIntent[]
  source: 'model' | 'rules_fallback'
  model: ModelProvenance | null
  /** Human vocab label (display / pack metadata). */
  vocab_version: string
  /** Content fingerprint tip for thin wire + pack-announce version. */
  vocab_tip: string
  latency_ms: number
}