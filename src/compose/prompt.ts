import type { EventSummary } from '../types/event-summary.js'
import type { Vocabulary } from '../types/vocabulary.js'
import { englishLabel } from '../vocab/label-lookup.js'

const SYSTEM = `You choose advice using only vocabulary IDs. Never invent IDs.
Severity may not be more than one band below the event band.
Output JSON only matching the schema. English labels are hints only.`

export function buildComposeMessages(
  vocab: Vocabulary,
  event: EventSummary,
): Array<{ role: 'system' | 'user'; content: string }> {
  const candidateLines: string[] = []
  for (const id of event.candidate_action_ids) {
    candidateLines.push(`action ${id}: ${englishLabel(vocab, id) ?? id}`)
  }
  for (const id of event.candidate_place_ids) {
    candidateLines.push(`place ${id}: ${englishLabel(vocab, id) ?? id}`)
  }
  for (const id of event.candidate_resource_ids) {
    candidateLines.push(`resource ${id}: ${englishLabel(vocab, id) ?? id}`)
  }
  for (const id of event.actors) {
    candidateLines.push(`actor ${id}: ${englishLabel(vocab, id) ?? id}`)
  }

  const user = [
    'Event summary:',
    JSON.stringify(event),
    'Candidates:',
    ...candidateLines,
    'Return per_actor for each actor in the event.',
  ].join('\n')

  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: user },
  ]
}