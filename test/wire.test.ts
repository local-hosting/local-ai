import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import {
  decodeIntentFrame,
  encodeIntentFrame,
  formatPackDelta,
  parsePackDelta,
} from '../src/wire/encode-decode.js'
import { composeIntentToWireFrame } from '../src/wire/intent-from-compose.js'
import { demoVocabFixture } from '../src/vocab/fixture-demo.js'
import { rulesFallbackIntent } from '../src/compose/rules-fallback.js'
import type { EventSummary } from '../src/types/event-summary.js'

describe('compact air frames', () => {
  it('intent frame roundtrip', () => {
    const frame = {
      kind: 'intent' as const,
      vocab_base: '0.2.0',
      event_code: 1,
      band: 3 as const,
      actor_codes: [40, 41],
      action_codes: [10, 11],
      place_codes: [20],
    }
    const wire = encodeIntentFrame(frame)
    const back = decodeIntentFrame(wire)
    expect(back?.band).toBe(3)
    expect(back?.action_codes).toEqual([10, 11])
  })

  it('host pack-delta roundtrip', () => {
    const line =
      'peerA>>vocab@0.1.0::1::2|item1^rating=not_here^event_id=abc'
    const parsed = parsePackDelta(line)
    expect(parsed?.updates?.[0].fields.rating).toBe('not_here')
    expect(parsed?.updates?.[0].fields.event_id).toBe('abc')
    const out = formatPackDelta(parsed!)
    expect(out).toContain('peerA>>vocab@0.1.0::1::2')
    expect(out).toContain('event_id=abc')
  })

  it('compose intent to compact frame', () => {
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
      candidate_resource_ids: [],
      actors: ['PR_1'],
    }
    const intent = rulesFallbackIntent(demoVocabFixture, event, { latency_ms: 0 })
    const frame = composeIntentToWireFrame(demoVocabFixture, intent)
    expect(frame?.vocab_base).toMatch(/^fp-/)
    expect(frame?.vocab_base).toBe(intent.vocab_tip)
    expect(frame?.event_code).toBe(1)
    expect(frame?.action_codes?.length).toBeGreaterThan(0)
  })
})
