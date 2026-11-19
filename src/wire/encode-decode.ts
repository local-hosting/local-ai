import {
  SYMBOL_INTENT,
  intentCodec,
  intentToCompact,
  compactToIntent,
} from '@local-hosting/compose'
import type { IntentFrame } from '../types/wire.js'

export {
  SYMBOL_INTENT,
  SYMBOL_READING,
  SYMBOL_DIGEST,
  SYMBOL_PATTERN,
  SYMBOL_RATING,
  encodeSymbolEnvelope,
  decodeSymbolEnvelope,
} from '@local-hosting/compose'

export { parsePackDelta, formatPackDelta } from './pack-announce.js'

export function encodeIntentFrame(frame: IntentFrame): string {
  return intentCodec.encode(
    intentToCompact(frame.vocab_base, {
      event_code: frame.event_code,
      band: frame.band,
      actor_codes: frame.actor_codes,
      action_codes: frame.action_codes,
      place_codes: frame.place_codes,
    }),
  )
}

export function decodeIntentFrame(line: string): IntentFrame | null {
  const compact = intentCodec.decode(line)
  if (!compact) return null
  const body = compactToIntent(compact)
  if (!body) return null
  return {
    kind: 'intent',
    vocab_base: body.vocab_base,
    event_code: body.event_code,
    band: body.band,
    actor_codes: body.actor_codes,
    action_codes: body.action_codes,
    place_codes: body.place_codes,
  }
}
