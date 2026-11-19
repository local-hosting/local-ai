import { describe, expect, it } from 'vitest'
import { demoVocabFixture } from '../src/vocab/fixture-demo.js'
import {
  resolveCodeById,
  resolveIdByCode,
  vocabularyToSymbolTable,
} from '../src/vocab/symbol-table.js'
import { encodeIntentFrame, decodeIntentFrame } from '../src/wire/encode-decode.js'
import { composeIntentToWireFrame } from '../src/wire/intent-from-compose.js'
import { rulesFallbackIntent } from '../src/compose/rules-fallback.js'
import { randomUUID } from 'node:crypto'

describe('local symbol table', () => {
  it('roundtrips id ↔ code for smoke vocab', () => {
    const table = vocabularyToSymbolTable(demoVocabFixture)
    expect(table.entries.length).toBeGreaterThan(0)
    const id = 'P_1'
    const code = resolveCodeById(table, id)
    expect(code).toBe(20)
    expect(resolveIdByCode(table, 'place', code!)).toBe(id)
  })

  it('loRa frame uses vocab_base from symbol table', () => {
    const table = vocabularyToSymbolTable(demoVocabFixture)
    const event = {
      event_id: randomUUID(),
      event_ref: 'E_1',
      h3_cell: '88283472b3fffff',
      band: 3 as const,
      trend: 'rising' as const,
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
    expect(frame?.vocab_base).toBe(table.vocab_base)
    expect(table.vocab_base).toMatch(/^fp-/)
    const wire = encodeIntentFrame(frame!)
    expect(decodeIntentFrame(wire)?.vocab_base).toBe(table.vocab_base)
  })
})