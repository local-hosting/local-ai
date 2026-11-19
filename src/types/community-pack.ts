import type { ComposeIntent } from './compose.js'
import type { CommunityRating } from './ratings.js'
import type { Vocabulary } from './vocabulary.js'

/**
 * Community pack item kinds for local AI.
 * Host registers pack ids; these are pack body rows — not ledger events.
 * Live writes stay in the host — this package only shapes items.
 */
export type CommunityPackItemKind =
  | 'community_ai_vocab'
  | 'community_compose_intent'
  | 'community_compose_rating'

export type CommunityPackRef = {
  locker_did: string
  /** Pack id on the community locker (e.g. `community-ai`, `community-compose`). */
  pack_id: string
}

export type CommunityAiVocabItem = CommunityPackRef & {
  version: 1
  item_kind: 'community_ai_vocab'
  item_id: string
  vocab: Vocabulary
}

export type CommunityComposeIntentItem = CommunityPackRef & {
  version: 1
  item_kind: 'community_compose_intent'
  item_id: string
  intent: ComposeIntent
}

export type CommunityComposeRatingItem = CommunityPackRef & {
  version: 1
  item_kind: 'community_compose_rating'
  item_id: string
} & CommunityRating

export type CommunityPackItem =
  | CommunityAiVocabItem
  | CommunityComposeIntentItem
  | CommunityComposeRatingItem

/** Fat-pipe write intent — host binds storage and appends; this package does not write packs. */
export type CommunityPackWrite = {
  locker_did: string
  pack_id: string
  item: CommunityPackItem
}
