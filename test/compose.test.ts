import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { compose } from '../src/compose/compose.js'
import { demoVocabFixture } from '../src/vocab/fixture-demo.js'
import type { EventSummary } from '../src/types/event-summary.js'
import { validateComposeOutput } from '../src/compose/validate-output.js'
import { rulesFallbackIntent } from '../src/compose/rules-fallback.js'
import { maybeRulesOnly } from '../src/wrap/maybe-rules-only.js'
import { readManifest } from '../src/manifest.js'
import { readFileSync } from 'node:fs'
import path from 'node:path'

function smokeEvent(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    event_id: randomUUID(),
    event_ref: 'E_1',
    h3_cell: '88283472b3fffff',
    band: 3,
    trend: 'rising',
    sensors_agreeing: 3,
    started_utc: '2026-08-14T02:10:00Z',
    reports: [],
    candidate_action_ids: ['A_1', 'A_2', 'A_3', 'A_4'],
    candidate_place_ids: ['P_1', 'P_2'],
    candidate_resource_ids: ['R_1'],
    actors: ['PR_1', 'PR_2'],
    ...overrides,
  }
}

describe('compose', () => {
  it('rules fallback when llama unreachable', async () => {
    const event = smokeEvent()
    const intent = await compose(
      { vocab: demoVocabFixture, event },
      { llamaBaseUrl: 'http://127.0.0.1:1', timeoutMs: 50 },
    )
    expect(intent.source).toBe('rules_fallback')
    for (const row of intent.per_actor) {
      for (const id of row.action_ids) {
        expect(event.candidate_action_ids).toContain(id)
      }
    }
  })

  it('pre-hook forces rules_fallback without llama', async () => {
    const event = smokeEvent({ sensors_agreeing: 0 })
    const early = maybeRulesOnly(demoVocabFixture, event)
    expect(early?.source).toBe('rules_fallback')
  })

  it('validate rejects invalid action id', () => {
    const event = smokeEvent()
    const bad = validateComposeOutput(event, [
      {
        actor_id: 'PR_1',
        severity: 3,
        action_ids: ['A_INVENTED'],
      },
    ])
    expect(bad.ok).toBe(false)
  })

  it('malformed path uses rules fallback helper', () => {
    const event = smokeEvent()
    const intent = rulesFallbackIntent(demoVocabFixture, event, { latency_ms: 1 })
    expect(intent.source).toBe('rules_fallback')
  })

  it('compose samples ids subset', async () => {
    const file = path.join(process.cwd(), 'eval', 'compose_samples.jsonl')
    const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean)
    expect(lines.length).toBe(20)
    for (const line of lines) {
      const sample = JSON.parse(line) as { event: EventSummary }
      const intent = await compose(
        { vocab: demoVocabFixture, event: sample.event },
        { llamaBaseUrl: 'http://127.0.0.1:1', timeoutMs: 10 },
      )
      for (const row of intent.per_actor) {
        for (const id of row.action_ids) {
          expect(sample.event.candidate_action_ids).toContain(id)
        }
      }
    }
  })
})

describe('manifest', () => {
  it('exposes composer name and sha', () => {
    const doc = readManifest()
    const composer = doc.models.find((m) => m.name === doc.chosen_composer)
    expect(composer?.sha256).toBeTruthy()
    expect(composer?.filename).toBeTruthy()
  })
})