import type { SupportedLanguage, Vocabulary } from '../types/vocabulary.js'

function allLabeled(vocab: Vocabulary) {
  return [
    ...vocab.events,
    ...vocab.actions,
    ...vocab.places,
    ...vocab.resources,
    ...vocab.actors,
  ]
}

export function englishLabel(
  vocab: Vocabulary,
  id: string,
): string | undefined {
  return allLabeled(vocab).find((e) => e.id === id)?.labels.en
}

export function labelInLang(
  vocab: Vocabulary,
  id: string,
  lang: SupportedLanguage,
): string | undefined {
  const row = allLabeled(vocab).find((e) => e.id === id)
  if (!row) return undefined
  return row.labels[lang] ?? row.labels.en
}

export function codeForId(vocab: Vocabulary, id: string): number | undefined {
  return allLabeled(vocab).find((e) => e.id === id)?.code
}

export function idForCode(vocab: Vocabulary, code: number): string | undefined {
  return allLabeled(vocab).find((e) => e.code === code)?.id
}
