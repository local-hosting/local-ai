import { describe, expect, it } from 'vitest'
import { mapQuestionLexicon } from '../src/map/lexicon-question.js'

describe('map question lexicon', () => {
  it('labels Où puis-je aller? as where_to_go', () => {
    expect(mapQuestionLexicon('Où puis-je aller?', 'fr').label).toBe('where_to_go')
  })

  it('labels ¿Adónde puedo ir? as where_to_go', () => {
    expect(mapQuestionLexicon('¿Adónde puedo ir?', 'es').label).toBe('where_to_go')
  })
})