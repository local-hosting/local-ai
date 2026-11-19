import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { composeRequestSchema } from '../src/vocab/schemas.js'
import { demoVocabFixture } from '../src/vocab/fixture-demo.js'

describe('vocab schema (events only)', () => {
  it('accepts current compose request shape', () => {
    const parsed = composeRequestSchema.safeParse({
      vocab: demoVocabFixture,
      event: {
        event_id: randomUUID(),
        event_ref: 'E_1',
        h3_cell: '88283472b3fffff',
        band: 3,
        trend: 'rising',
        sensors_agreeing: 3,
        started_utc: '2026-08-14T02:10:00Z',
        reports: [],
        candidate_action_ids: ['A_1'],
        candidate_place_ids: ['P_1'],
        candidate_resource_ids: [],
        actors: ['PR_1'],
      },
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects legacy situations / situation_hint', () => {
    const { events: _events, ...restVocab } = demoVocabFixture
    const legacyVocab = {
      ...restVocab,
      situations: demoVocabFixture.events,
    }

    expect(
      composeRequestSchema.safeParse({
        vocab: legacyVocab,
        event: {
          event_id: randomUUID(),
          situation_hint: 'S_SMOKE',
          h3_cell: '88283472b3fffff',
          band: 3,
          trend: 'rising',
          sensors_agreeing: 3,
          started_utc: '2026-08-14T02:10:00Z',
          reports: [],
          candidate_action_ids: ['A_1'],
          candidate_place_ids: [],
          candidate_resource_ids: [],
          actors: ['PR_1'],
        },
      }).success,
    ).toBe(false)
  })
})