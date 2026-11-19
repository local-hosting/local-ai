import type { ComposeIntent, PerActorIntent } from '../types/compose.js'
import type { EventSummary } from '../types/event-summary.js'
import type { Vocabulary } from '../types/vocabulary.js'
import { vocabularyTip } from '../vocab/symbol-table.js'

export function rulesFallbackIntent(
  vocab: Vocabulary,
  event: EventSummary,
  extra: { latency_ms: number },
): ComposeIntent {
  const bandKey = String(event.band)
  const eventRef = event.event_ref
  const defaultActions = vocab.defaults[eventRef]?.[bandKey] ?? []
  const per_actor: PerActorIntent[] = event.actors.map((actor_id) => ({
    actor_id,
    severity: event.band,
    action_ids: (() => {
      const filtered = defaultActions.filter((id) =>
        event.candidate_action_ids.includes(id),
      )
      if (filtered.length > 0) return filtered
      return [event.candidate_action_ids[0]].filter(Boolean)
    })(),
  }))

  return {
    event_id: event.event_id,
    event_ref: event.event_ref,
    per_actor,
    source: 'rules_fallback',
    model: null,
    vocab_version: vocab.vocab_version,
    vocab_tip: vocabularyTip(vocab),
    latency_ms: extra.latency_ms,
  }
}