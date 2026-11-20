import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compose } from '../src/compose/compose.js'
import { mapQuestionLexicon } from '../src/map/lexicon-question.js'
import { demoVocabFixture } from '../src/vocab/fixture-demo.js'
import type { EventSummary } from '../src/types/event-summary.js'
import type { SupportedLanguage } from '../src/types/vocabulary.js'
import { readManifest } from '../src/manifest.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

type ComposeSample = {
  event: EventSummary
  acceptable_action_ids?: string[][]
  severity_min?: number
  severity_max?: number
}

type MapSample = {
  kind: 'question' | 'report'
  text: string
  lang: SupportedLanguage
  expected_label?: string
}

function readJsonl<T>(file: string): T[] {
  const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean)
  return lines.map((l) => JSON.parse(l) as T)
}

async function main(): Promise<void> {
  const composePath = path.join(repoRoot, 'eval', 'compose_samples.jsonl')
  const mapPath = path.join(repoRoot, 'eval', 'map_samples.jsonl')
  const composeSamples = readJsonl<ComposeSample>(composePath)
  const mapSamples = readJsonl<MapSample>(mapPath)

  let composeValid = 0
  let composeAcceptable = 0
  const latencies: number[] = []

  for (const sample of composeSamples) {
    const intent = await compose(
      { vocab: demoVocabFixture, event: sample.event },
      {
        llamaBaseUrl: process.env.LOCAL_AI_LLAMA_BASE_URL ?? 'http://127.0.0.1:8080',
        timeoutMs: Number(process.env.LOCAL_AI_EVAL_TIMEOUT_MS ?? 15_000),
        rulesOnlyForce: false,
      },
    )
    latencies.push(intent.latency_ms)
    const idsOk = intent.per_actor.every((row) =>
      row.action_ids.every((id) => sample.event.candidate_action_ids.includes(id)),
    )
    if (idsOk) composeValid += 1
    if (
      sample.acceptable_action_ids &&
      intent.per_actor.length === sample.acceptable_action_ids.length
    ) {
      const ok = intent.per_actor.every((row, i) => {
        const allowed = new Set(sample.acceptable_action_ids![i])
        return row.action_ids.every((id) => allowed.has(id))
      })
      if (ok) composeAcceptable += 1
    } else if (idsOk) {
      composeAcceptable += 1
    }
  }

  let mapCorrect = 0
  const questions = mapSamples.filter((s) => s.kind === 'question')
  for (const sample of questions) {
    const result = mapQuestionLexicon(sample.text, sample.lang)
    if (sample.expected_label && result.label === sample.expected_label) {
      mapCorrect += 1
    }
  }

  const doc = readManifest()
  const manifestPath = path.join(repoRoot, 'models', 'MANIFEST.json')
  doc.chosen_composer = doc.chosen_composer ?? 'gemma-4-e2b'
  writeFileSync(manifestPath, `${JSON.stringify(doc, null, 2)}\n`)

  console.log('eval summary')
  console.table({
    compose_valid_pct: (composeValid / composeSamples.length) * 100,
    compose_acceptable_pct: (composeAcceptable / composeSamples.length) * 100,
    map_question_pct: questions.length
      ? (mapCorrect / questions.length) * 100
      : 0,
    median_latency_ms: latencies.sort((a, b) => a - b)[Math.floor(latencies.length / 2)] ?? 0,
    chosen_composer: doc.chosen_composer,
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})