import type {
  CommunityComposeIntentItem,
  CommunityComposeRatingItem,
  CommunityPackItem,
} from '../types/community-pack.js'
import type { IntentFrame, PackDeltaFrame } from '../types/wire.js'
import type { Vocabulary } from '../types/vocabulary.js'
import { encodeIntentFrame } from './encode-decode.js'
import { composeIntentToWireFrame } from './intent-from-compose.js'

/**
 * Map community pack rows → host pack-announcement frames.
 * Fat pipe still pushes full pack bodies; thin pipe carries field patches only.
 */

export type PackDeltaContext = {
  peer: string
  seq: number
  itemCount: number
}

export function ratingItemToPackDelta(
  item: CommunityComposeRatingItem,
  ctx: PackDeltaContext,
): PackDeltaFrame {
  const fields: Record<string, string | number> = {
    rating: item.kind,
    event_id: item.event_id,
    rated_utc: item.rated_utc,
  }
  if (item.action_ids?.length) fields.action_ids = item.action_ids.join(',')
  if (item.place_ids?.length) fields.place_ids = item.place_ids.join(',')
  if (item.actor_id) fields.actor_id = item.actor_id
  return {
    peer: ctx.peer,
    pack: item.pack_id,
    version: String(item.version),
    seq: ctx.seq,
    itemCount: ctx.itemCount,
    updates: [{ itemId: item.item_id, fields }],
  }
}

/** Intent body uses compact intent frame; delta only announces item id + event. */
export function intentItemToPackDelta(
  item: CommunityComposeIntentItem,
  ctx: PackDeltaContext,
): PackDeltaFrame {
  return {
    peer: ctx.peer,
    pack: item.pack_id,
    // Fat/thin tip identity: announce fingerprint, not human label.
    version: item.intent.vocab_tip || item.intent.vocab_version,
    seq: ctx.seq,
    itemCount: ctx.itemCount,
    updates: [
      {
        itemId: item.item_id,
        fields: {
          kind: 'intent',
          event_id: item.intent.event_id,
          source: item.intent.source,
        },
      },
    ],
  }
}

export function intentItemToWire(
  vocab: Vocabulary,
  item: CommunityComposeIntentItem,
): string | null {
  const frame: IntentFrame | null = composeIntentToWireFrame(vocab, item.intent)
  if (!frame) return null
  return encodeIntentFrame(frame)
}

export function communityPackItemToPackDelta(
  item: CommunityPackItem,
  ctx: PackDeltaContext,
): PackDeltaFrame | null {
  switch (item.item_kind) {
    case 'community_compose_rating':
      return ratingItemToPackDelta(item, ctx)
    case 'community_compose_intent':
      return intentItemToPackDelta(item, ctx)
    case 'community_ai_vocab':
      // Vocab travels fat pipe only — never thin air.
      return null
    default: {
      const _exhaustive: never = item
      return _exhaustive
    }
  }
}
