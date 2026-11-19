import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { rulesFallbackIntent } from '../src/compose/rules-fallback.js'
import {
  applyPackDeltaToView,
  createCommunityPackView,
} from '../src/wire/apply-delta-view.js'
import { formatPackDelta, parsePackDelta } from '../src/wire/encode-decode.js'
import {
  communityPackItemToPackDelta,
  intentItemToWire,
  ratingItemToPackDelta,
} from '../src/wire/pack-delta.js'
import { demoVocabFixture } from '../src/vocab/fixture-demo.js'
import type { EventSummary } from '../src/types/event-summary.js'
import {
  buildCommunityComposeIntentItem,
  buildCommunityComposeRatingItem,
  buildCommunityAiVocabItem,
  toCommunityPackWrite,
} from '../src/wrap/community-pack-items.js'
import { elevateForCompose } from '../src/wrap/elevate-for-compose.js'

const locker = 'did:locker:community-demo'
const packCompose = 'community-compose'
const packVocab = 'community-ai'

describe('community pack wrap', () => {
  it('elevates only vocab+event (deny raw / unsealed)', () => {
    const event: EventSummary = {
      event_id: randomUUID(),
      event_ref: 'E_1',
      h3_cell: '88283472b3fffff',
      band: 3,
      trend: 'rising',
      sensors_agreeing: 2,
      started_utc: '2026-08-14T02:10:00Z',
      reports: [],
      candidate_action_ids: ['A_1'],
      candidate_place_ids: ['P_1'],
      candidate_resource_ids: [],
      actors: ['PR_1'],
    }
    expect(elevateForCompose({ vocab: demoVocabFixture, event }).ok).toBe(true)
    expect(elevateForCompose({ vocab: demoVocabFixture, event, raw_sensors: [] }).ok).toBe(
      false,
    )
    expect(
      elevateForCompose({ vocab: demoVocabFixture, event, unsealed_items: [{}] }).ok,
    ).toBe(false)
  })

  it('shapes vocab pack write from demo vocab', () => {
    const item = buildCommunityAiVocabItem({
      locker_did: locker,
      pack_id: packVocab,
      vocab: demoVocabFixture,
    })
    const write = toCommunityPackWrite(item)
    expect(write.pack_id).toBe(packVocab)
    expect(write.item.item_kind).toBe('community_ai_vocab')
    expect(communityPackItemToPackDelta(item, { peer: 'boxA', seq: 1, itemCount: 1 })).toBeNull()
  })

  it('compose intent → pack item → compact intent wire + delta announcement', () => {
    const event: EventSummary = {
      event_id: randomUUID(),
      event_ref: 'E_1',
      h3_cell: '88283472b3fffff',
      band: 3,
      trend: 'rising',
      sensors_agreeing: 3,
      started_utc: '2026-08-14T02:10:00Z',
      reports: [],
      candidate_action_ids: ['A_1', 'A_2'],
      candidate_place_ids: ['P_1'],
      candidate_resource_ids: ['R_1'],
      actors: ['PR_1'],
    }
    const elevated = elevateForCompose({ vocab: demoVocabFixture, event })
    expect(elevated.ok).toBe(true)
    if (!elevated.ok) return

    const intent = rulesFallbackIntent(elevated.payload.vocab, elevated.payload.event, {
      latency_ms: 0,
    })
    const item = buildCommunityComposeIntentItem({
      locker_did: locker,
      pack_id: packCompose,
      intent,
    })
    const wire = intentItemToWire(demoVocabFixture, item)
    expect(wire?.startsWith('4:')).toBe(true)

    const delta = communityPackItemToPackDelta(item, {
      peer: 'boxA',
      seq: 2,
      itemCount: 1,
    })
    expect(delta?.updates?.[0].fields.kind).toBe('intent')
    expect(parsePackDelta(formatPackDelta(delta!))?.pack).toBe(packCompose)
  })

  it('rating pack item → pack delta → peer pack view', () => {
    const item = buildCommunityComposeRatingItem({
      locker_did: locker,
      pack_id: packCompose,
      item_id: 'rating-1',
      rating: {
        event_id: 'evt-1',
        kind: 'not_here',
        action_ids: ['A_1'],
        rated_utc: '2026-08-14T03:00:00Z',
      },
    })
    const delta = ratingItemToPackDelta(item, { peer: 'boxB', seq: 3, itemCount: 1 })
    const line = formatPackDelta(delta)
    expect(line).toContain('rating=not_here')

    const view = applyPackDeltaToView(createCommunityPackView(), parsePackDelta(line)!)
    expect(view.get('rating-1')?.rating).toBe('not_here')
    expect(view.get('rating-1')?.event_id).toBe('evt-1')

    const dropped = applyPackDeltaToView(view, {
      peer: 'boxB',
      pack: packCompose,
      version: '1',
      seq: 4,
      itemCount: 0,
      dropItemId: 'rating-1',
    })
    expect(dropped.has('rating-1')).toBe(false)
  })
})
