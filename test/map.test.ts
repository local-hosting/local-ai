import { describe, expect, it } from 'vitest'
import { mapQuestionLexicon } from '../src/map/lexicon-question.js'
import { mapReportLexicon } from '../src/map/lexicon-report.js'
import { QUESTION_LABELS, REPORT_TYPES } from '../src/types/map.js'
import catalog from '../src/map/map-catalog.json' with { type: 'json' }
import { demoVocabFixture } from '../src/vocab/fixture-demo.js'

describe('map catalog', () => {
  it('exports labels from shared catalog', () => {
    expect(QUESTION_LABELS).toEqual(catalog.question_labels)
    expect(REPORT_TYPES).toEqual(catalog.report_types)
  })
})

describe('map question lexicon', () => {
  it('labels Où puis-je aller? as where_to_go', () => {
    expect(mapQuestionLexicon('Où puis-je aller?', 'fr').label).toBe('where_to_go')
  })

  it('labels ¿Adónde puedo ir? as where_to_go', () => {
    expect(mapQuestionLexicon('¿Adónde puedo ir?', 'es').label).toBe('where_to_go')
  })
})

describe('map report lexicon', () => {
  it('labels worse conditions from shared cues', () => {
    const result = mapReportLexicon('things are worse here', 'en', demoVocabFixture)
    expect(result.report_type).toBe('worse_here')
    expect(result.confidence).toBe(catalog.lexicon_confidence.report_hit)
  })
})
