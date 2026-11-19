import { describe, expect, it } from 'vitest'
import { assertElevatedInput } from '../src/wrap/deny-list.js'
import { buildCommunityComposeRatingItem } from '../src/wrap/community-pack-items.js'

describe('wrap', () => {
  it('denies raw sensors', () => {
    expect(assertElevatedInput({ vocab: {}, event: {}, raw_sensors: [] })).toBe(
      'raw_payload',
    )
  })

  it('builds community compose rating item', () => {
    const item = buildCommunityComposeRatingItem({
      locker_did: 'did:locker:demo',
      pack_id: 'community-compose',
      rating: {
        event_id: 'e1',
        kind: 'not_here',
        rated_utc: '2026-01-01T00:00:00Z',
      },
    })
    expect(item.item_kind).toBe('community_compose_rating')
  })
})
