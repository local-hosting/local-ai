import catalog from './map-catalog.json' with { type: 'json' }
import type { ReportMapResult, ReportType } from '../types/map.js'
import type { SupportedLanguage, Vocabulary } from '../types/vocabulary.js'

const CONFIDENCE_FLOOR = 0.5

function placeMatch(text: string, vocab: Vocabulary): string | null {
  const textL = text.toLowerCase()
  for (const place of vocab.places) {
    for (const label of Object.values(place.labels)) {
      if (label && textL.includes(label.toLowerCase())) return place.id
    }
  }
  return null
}

function eventMatch(text: string, vocab: Vocabulary): string | null {
  const textL = text.toLowerCase()
  for (const event of vocab.events) {
    for (const label of Object.values(event.labels)) {
      if (label && textL.includes(label.toLowerCase())) return event.id
    }
  }
  return null
}

type ReportCue =
  | { type: string; any: string[] }
  | { type: string; all: string[] }

export function mapReportLexicon(
  text: string,
  _lang: SupportedLanguage,
  vocab: Vocabulary,
): ReportMapResult {
  const textL = text.toLowerCase()
  let reportType: ReportType = 'other'
  for (const cue of catalog.report_cues as ReportCue[]) {
    const type = cue.type as ReportType
    if ('all' in cue) {
      if (cue.all.every((token) => textL.includes(token.toLowerCase()))) {
        reportType = type
        break
      }
    } else if (cue.any.some((token) => textL.includes(token.toLowerCase()))) {
      reportType = type
      break
    }
  }

  const confidence =
    reportType !== 'other'
      ? catalog.lexicon_confidence.report_hit
      : catalog.lexicon_confidence.report_miss

  let finalType = reportType
  if (confidence < CONFIDENCE_FLOOR && finalType !== 'other') {
    finalType = 'other'
  }

  return {
    report_type: finalType,
    event_ref: eventMatch(text, vocab),
    place_id: placeMatch(text, vocab),
    confidence,
  }
}
