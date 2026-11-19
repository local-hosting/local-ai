import type { ComposeIntent, PerActorIntent } from '../types/compose.js'
import type { EventSummary } from '../types/event-summary.js'
import type { Vocabulary } from '../types/vocabulary.js'
import { rulesFallbackIntent } from '../compose/rules-fallback.js'

export type RulesOnlyOptions = {
  /** When true, always rules fallback (tests / pattern short-circuit stub). */
  force?: boolean
}

export function maybeRulesOnly(
  vocab: Vocabulary,
  event: EventSummary,
  options: RulesOnlyOptions = {},
): ComposeIntent | null {
  if (options.force) {
    return rulesFallbackIntent(vocab, event, { latency_ms: 0 })
  }
  if (event.sensors_agreeing === 0) {
    return rulesFallbackIntent(vocab, event, { latency_ms: 0 })
  }
  return null
}