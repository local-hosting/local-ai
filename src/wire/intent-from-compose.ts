import { composeIntentToCompact, compactToIntent, vocabularyTip } from '@local-hosting/compose'
import type { ComposeIntent } from '../types/compose.js'
import type { Vocabulary } from '../types/vocabulary.js'
import type { IntentFrame } from '../types/wire.js'

export function composeIntentToWireFrame(
  vocab: Vocabulary,
  intent: ComposeIntent,
): IntentFrame | null {
  const row = intent.per_actor[0]
  if (!row) return null
  const frame = composeIntentToCompact(vocab, {
    event_ref: intent.event_ref,
    band: row.severity,
    actor_ids: intent.per_actor.map((p) => p.actor_id),
    action_ids: row.action_ids,
    place_ids: row.place_ids,
    vocab_tip: intent.vocab_tip || vocabularyTip(vocab),
  })
  if (!frame) return null
  const body = compactToIntent(frame)
  if (!body) return null
  return {
    vocab_base: body.vocab_base,
    event_code: body.event_code,
    band: body.band,
    actor_codes: body.actor_codes,
    action_codes: body.action_codes,
    place_codes: body.place_codes,
  }
}