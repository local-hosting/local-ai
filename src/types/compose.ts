import type { EventSummary } from './event-summary.js'
import type { QuestionLabel } from './map.js'
import type { Vocabulary } from './vocabulary.js'

export type ComposeQuestionLabel = QuestionLabel | 'other'

export type PlaceRankingHint = {
  id: string
  rank: number
  distance_m?: number
  type?: string
}

export type ComposeRequest = {
  vocab: Vocabulary
  event: EventSummary
  /** Resident question or report text (spatial compose). */
  resident_text?: string
  /** Geo-ranked place candidates shown to the composer. */
  place_ranking?: PlaceRankingHint[]
  /** Mapped question type (spatial path); steers prompt + narrowed actions. */
  question_label?: ComposeQuestionLabel
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