import type { ComposeIntent } from '../types/compose.js'
import type { Vocabulary } from '../types/vocabulary.js'
import { codeForId } from '../vocab/label-lookup.js'
import { vocabularyTip } from '../vocab/symbol-table.js'
import type { IntentFrame } from '../types/wire.js'

export function composeIntentToWireFrame(
  vocab: Vocabulary,
  intent: ComposeIntent,
): IntentFrame | null {
  const row = intent.per_actor[0]
  if (!row) return null
  const event_code = codeForId(vocab, intent.event_ref) ?? 1
  return {
    vocab_base: intent.vocab_tip || vocabularyTip(vocab),
    event_code,
    band: row.severity,
    actor_codes: intent.per_actor
      .map((p) => codeForId(vocab, p.actor_id))
      .filter((n): n is number => n !== undefined),
    action_codes: row.action_ids
      .map((id) => codeForId(vocab, id))
      .filter((n): n is number => n !== undefined),
    place_codes: (row.place_ids ?? [])
      .map((id) => codeForId(vocab, id))
      .filter((n): n is number => n !== undefined),
  }
}