import { randomUUID } from 'node:crypto'
import type { ComposeIntent } from '../types/compose.js'
import type {
  CommunityComposeIntentItem,
  CommunityComposeRatingItem,
  CommunityAiVocabItem,
  CommunityPackRef,
  CommunityPackWrite,
} from '../types/community-pack.js'
import type { CommunityRating } from '../types/ratings.js'
import type { Vocabulary } from '../types/vocabulary.js'

export type BuildVocabPackItemOptions = CommunityPackRef & {
  vocab: Vocabulary
  item_id?: string
}

export type BuildIntentPackItemOptions = CommunityPackRef & {
  intent: ComposeIntent
  item_id?: string
}

export type BuildRatingPackItemOptions = CommunityPackRef & {
  rating: CommunityRating
  item_id?: string
}

/** Vocab → community locker pack row (fat sync / USB). */
export function buildCommunityAiVocabItem(
  opts: BuildVocabPackItemOptions,
): CommunityAiVocabItem {
  return {
    version: 1,
    locker_did: opts.locker_did,
    pack_id: opts.pack_id,
    item_kind: 'community_ai_vocab',
    item_id: opts.item_id ?? `vocab:${opts.vocab.vocab_version}`,
    vocab: opts.vocab,
  }
}

/** Elevated compose output → compose pack row (IDs only; never raw sensors). */
export function buildCommunityComposeIntentItem(
  opts: BuildIntentPackItemOptions,
): CommunityComposeIntentItem {
  return {
    version: 1,
    locker_did: opts.locker_did,
    pack_id: opts.pack_id,
    item_kind: 'community_compose_intent',
    item_id: opts.item_id ?? opts.intent.event_id,
    intent: opts.intent,
  }
}

/** Community rating → ratings pack row (ACL-validated write upstream). */
export function buildCommunityComposeRatingItem(
  opts: BuildRatingPackItemOptions,
): CommunityComposeRatingItem {
  return {
    version: 1,
    locker_did: opts.locker_did,
    pack_id: opts.pack_id,
    item_kind: 'community_compose_rating',
    item_id: opts.item_id ?? randomUUID(),
    ...opts.rating,
  }
}

export function toCommunityPackWrite(item: CommunityAiVocabItem | CommunityComposeIntentItem | CommunityComposeRatingItem): CommunityPackWrite {
  return {
    locker_did: item.locker_did,
    pack_id: item.pack_id,
    item,
  }
}
