import catalog from './map-catalog.json' with { type: 'json' }
import type { QuestionLabel, QuestionMapResult } from '../types/map.js'
import type { SupportedLanguage } from '../types/vocabulary.js'

const questionPatterns = catalog.question_patterns as Record<QuestionLabel, string[]>

const PATTERNS: Record<QuestionLabel, RegExp[]> = {
  where_to_go: [],
  what_to_do: [],
  how_long: [],
  is_it_safe_for_kids: [],
  is_it_safe_outside: [],
  other: [],
}

for (const label of Object.keys(questionPatterns) as QuestionLabel[]) {
  PATTERNS[label] = questionPatterns[label].map((source: string) =>
    new RegExp(source, /[A-Za-z]/.test(source) ? 'i' : undefined),
  )
}

export function mapQuestionLexicon(
  text: string,
  _lang: SupportedLanguage,
): QuestionMapResult {
  const trimmed = text.trim()
  const hit = catalog.lexicon_confidence.question_hit
  const miss = catalog.lexicon_confidence.question_miss
  for (const label of Object.keys(PATTERNS) as QuestionLabel[]) {
    if (label === 'other') continue
    for (const re of PATTERNS[label]) {
      if (re.test(trimmed)) {
        return { label, confidence: hit }
      }
    }
  }
  return { label: 'other', confidence: miss }
}
