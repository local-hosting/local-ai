import { describe, expect, it } from 'vitest'
import { readMessageCorpus } from '@local-hosting/compose/messages'
import { mapQuestionLexicon } from '../src/map/lexicon-question.js'
import { mapReportLexicon } from '../src/map/lexicon-report.js'
import { QUESTION_LABELS, REPORT_TYPES } from '../src/types/map.js'
import catalog from '../src/map/map-catalog.json' with { type: 'json' }
import { demoVocabFixture } from '../src/vocab/fixture-demo.js'
import type { SupportedLanguage } from '../src/types/vocabulary.js'

const DOMAIN_CORPORA = ['everyday', 'resilience'] as const

describe('map catalog', () => {
  it('exports labels from shared catalog', () => {
    expect(QUESTION_LABELS).toEqual(catalog.question_labels)
    expect(REPORT_TYPES).toEqual(catalog.report_types)
  })
})

describe('map question lexicon (multilingual cues)', () => {
  it('labels Où puis-je aller? as where_to_go', () => {
    expect(mapQuestionLexicon('Où puis-je aller?', 'fr').label).toBe('where_to_go')
  })

  it('labels ¿Adónde puedo ir? as where_to_go', () => {
    expect(mapQuestionLexicon('¿Adónde puedo ir?', 'es').label).toBe('where_to_go')
  })
})

describe.each(DOMAIN_CORPORA)('map question lexicon (%s corpus)', (corpusId) => {
  const questions = readMessageCorpus(corpusId).messages.filter((m) => m.kind === 'question')

  it(`covers ${questions.length} question rows`, () => {
    expect(questions.length).toBeGreaterThan(0)
  })

  for (const row of questions) {
    it(row.id, () => {
      const mapped = mapQuestionLexicon(row.text, row.lang as SupportedLanguage)
      expect(QUESTION_LABELS).toContain(mapped.label)
      expect(mapped.confidence).toBeGreaterThanOrEqual(0)
    })
  }
})

describe.each(DOMAIN_CORPORA)('map report lexicon (%s corpus)', (corpusId) => {
  const reports = readMessageCorpus(corpusId).messages.filter((m) => m.kind === 'report')

  for (const row of reports) {
    it(row.id, () => {
      const mapped = mapReportLexicon(row.text, row.lang as SupportedLanguage, demoVocabFixture)
      expect(REPORT_TYPES).toContain(mapped.report_type)
      expect(mapped.confidence).toBeGreaterThanOrEqual(0)
    })
  }
})

describe('map question lexicon (resilience-synthetic bench)', () => {
  const cases: Array<[string, 'en' | 'es' | 'fr', string]> = [
    ['Where is the nearest shelter open right now?', 'en', 'where_to_go'],
    ['Any open evacuation center near me?', 'en', 'where_to_go'],
    ['flash flood warning — should we leave?', 'en', 'what_to_do'],
    ['Can I drive through the water on 3rd?', 'en', 'is_it_safe_outside'],
    ['¿Dónde hay refugio cerca?', 'es', 'where_to_go'],
    ['¿Cuánto durará la alerta?', 'es', 'how_long'],
    ['Où est le refuge le plus proche?', 'fr', 'where_to_go'],
  ]
  for (const [text, lang, label] of cases) {
    it(`${lang}: ${text.slice(0, 48)}…`, () => {
      expect(mapQuestionLexicon(text, lang).label).toBe(label)
    })
  }
})