import type { ComposeQuestionLabel, PlaceRankingHint } from '../types/compose.js'
import type { EventSummary } from '../types/event-summary.js'
import type { Vocabulary } from '../types/vocabulary.js'
import { englishLabel } from '../vocab/label-lookup.js'

export type ComposePromptContext = {
  resident_text?: string
  place_ranking?: PlaceRankingHint[]
  question_label?: ComposeQuestionLabel
}

const LABEL_HINTS: Partial<Record<ComposeQuestionLabel, string>> = {
  where_to_go:
    'Include the closest ranked place (rank 1) in place_ids when recommending a destination. Prefer A_SHELTER for shelter or evacuation-center questions.',
  what_to_do: 'Prefer band-appropriate actions; return at most two action_ids.',
  is_it_safe_outside: 'Prefer cautious actions (stay, evacuate, or move higher) matching conditions.',
}

const SYSTEM = `You choose advice using only vocabulary IDs. Never invent IDs.
Severity may not be more than one band below the event band.
Return at most two action_ids per actor unless the event band requires broader guidance.
Output JSON only matching the schema. English labels are hints only.`

export function buildComposeMessages(
  vocab: Vocabulary,
  event: EventSummary,
  context: ComposePromptContext = {},
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

  const rankingLines =
    context.place_ranking?.map((row) => {
      const dist =
        row.distance_m != null ? `${Math.round(row.distance_m)}m` : 'unknown'
      const typeHint = row.type ? ` type=${row.type}` : ''
      return `rank ${row.rank}: place ${row.id} distance ${dist}${typeHint}`
    }) ?? []

  const userParts = [
    'Event summary:',
    JSON.stringify(event),
  ]
  if (context.resident_text?.trim()) {
    userParts.push('Resident message:', context.resident_text.trim())
  }
  if (context.question_label && context.question_label !== 'other') {
    userParts.push(`Question type: ${context.question_label}`)
    const hint = LABEL_HINTS[context.question_label]
    if (hint) userParts.push(hint)
  }
  if (rankingLines.length > 0) {
    userParts.push(
      'Nearby places (closest first — prefer lower rank when choosing place_ids):',
      ...rankingLines,
    )
  }
  userParts.push('Candidates:', ...candidateLines, 'Return per_actor for each actor in the event.')

  const user = userParts.join('\n')

  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: user },
  ]
}