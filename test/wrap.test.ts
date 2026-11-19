import { describe, expect, it } from 'vitest'
import { assertElevatedInput } from '../src/wrap/deny-list.js'
import { buildLockerRatingItem } from '../src/wrap/ratings-locker-stub.js'

describe('wrap', () => {
  it('denies raw sensors', () => {
    expect(assertElevatedInput({ vocab: {}, event: {}, raw_sensors: [] })).toBe(
      'raw_payload',
    )
  })

  it('builds locker rating item', () => {
    const item = buildLockerRatingItem({
      community_locker_did: 'did:locker:demo',
      rating: {
        event_id: 'e1',
        kind: 'not_here',
        rated_utc: '2026-01-01T00:00:00Z',
      },
    })
    expect(item.item_kind).toBe('community_compose_rating')
  })
})