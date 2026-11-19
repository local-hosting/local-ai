import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const baseEvent = () => ({
  event_id: randomUUID(),
  event_ref: 'E_SMOKE',
  h3_cell: '88283472b3fffff',
  band: 3,
  trend: 'rising',
  sensors_agreeing: 3,
  started_utc: '2026-08-14T02:10:00Z',
  reports: [],
  candidate_action_ids: ['A_STAY_IN', 'A_NO_EXERT', 'A_MASK', 'A_GO_CLEAN_AIR'],
  candidate_place_ids: ['P_LIBRARY_MAIN', 'P_REC_CENTRE'],
  candidate_resource_ids: ['R_N95_PICKUP'],
  actors: ['PR_PARENT', 'PR_OUTDOOR'],
})

const compose = []
for (let i = 0; i < 20; i++) {
  const event = baseEvent()
  event.band = 2 + (i % 3)
  if (i % 4 === 3) event.sensors_agreeing = 0
  if (i % 5 === 4) event.candidate_place_ids = ['P_LIBRARY_MAIN']
  compose.push({
    event,
    acceptable_action_ids: [
      ['A_STAY_IN', 'A_NO_EXERT'],
      ['A_STAY_IN', 'A_NO_EXERT', 'A_MASK'],
    ],
  })
}

const questions = [
  ['Où puis-je aller?', 'fr', 'where_to_go'],
  ['¿Adónde puedo ir?', 'es', 'where_to_go'],
  ['What should I do?', 'en', 'what_to_do'],
  ['How long will this last?', 'en', 'how_long'],
  ['Is it safe for kids?', 'en', 'is_it_safe_for_kids'],
  ['Can I work outside?', 'en', 'is_it_safe_outside'],
]

const map = []
for (const [text, lang, label] of questions) {
  for (let k = 0; k < 5; k++) {
    map.push({ kind: 'question', text, lang, expected_label: label })
  }
}
for (let i = 0; i < 30; i++) {
  map.push({
    kind: 'report',
    text: i % 2 === 0 ? 'smoke worse here at school' : 'je vais bien',
    lang: i % 3 === 0 ? 'fr' : i % 3 === 1 ? 'es' : 'en',
  })
}

writeFileSync(
  path.join(root, 'eval', 'compose_samples.jsonl'),
  compose.map((l) => JSON.stringify(l)).join('\n') + '\n',
)
writeFileSync(
  path.join(root, 'eval', 'map_samples.jsonl'),
  map.map((l) => JSON.stringify(l)).join('\n') + '\n',
)