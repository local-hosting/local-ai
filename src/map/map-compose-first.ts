import { composeFromVocabulary } from '@local-hosting/compose'
import type { ReportMapResult } from '../types/map.js'
import type { SupportedLanguage, Vocabulary } from '../types/vocabulary.js'

export function mapReportComposeFirst(
  text: string,
  lang: SupportedLanguage,
  vocab: Vocabulary,
): ReportMapResult | null {
  const composed = composeFromVocabulary(text, vocab, lang)
  if (!composed.ok || composed.matched.length === 0) return null
  const event_ref = composed.matched.find((m) => m.kind === 'event')?.id ?? null
  const place_id = composed.matched.find((m) => m.kind === 'place')?.id ?? null
  return {
    report_type: 'other',
    event_ref,
    place_id,
    confidence: 0.85,
  }
}