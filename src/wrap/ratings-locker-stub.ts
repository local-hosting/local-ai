import type { CommunityRating } from '../types/ratings.js'
import { buildCommunityComposeRatingItem } from './community-pack-items.js'

/**
 * Stub: shape a rating pack row for the community locker (ACL-validated upstream).
 * Live writes stay in the host — not in this package.
 */
export type LockerRatingWriteRequest = {
  community_locker_did: string
  /** Defaults to `community-compose` when omitted. */
  pack_id?: string
  rating: CommunityRating
}

export function buildLockerRatingItem(
  req: LockerRatingWriteRequest,
): Record<string, unknown> {
  const item = buildCommunityComposeRatingItem({
    locker_did: req.community_locker_did,
    pack_id: req.pack_id ?? 'community-compose',
    rating: req.rating,
  })
  return { ...item }
}
