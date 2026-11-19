import type { SupportedLanguage, Vocabulary } from '../types/vocabulary.js'

export function englishLabel(
  vocab: Vocabulary,
  id: string,
): string | undefined {
  const all = [
    ...vocab.events,
    ...vocab.actions,
    ...vocab.places,
    ...vocab.resources,
    ...vocab.actors,
  ]
  const row = all.find((e) => e.id === id)
  return row?.labels.en
}

export function labelInLang(
  vocab: Vocabulary,
  id: string,
  lang: SupportedLanguage,
): string | undefined {
  const all = [
    ...vocab.events,
    ...vocab.actions,
    ...vocab.places,
    ...vocab.resources,
    ...vocab.actors,
  ]
  const row = all.find((e) => e.id === id)
  if (!row) return undefined
  return row.labels[lang] ?? row.labels.en
}

export function codeForId(vocab: Vocabulary, id: string): number | undefined {
  const all = [
    ...vocab.events,
    ...vocab.actions,
    ...vocab.places,
    ...vocab.resources,
    ...vocab.actors,
  ]
  return all.find((e) => e.id === id)?.code
}

export function idForCode(vocab: Vocabulary, code: number): string | undefined {
  const all = [
    ...vocab.events,
    ...vocab.actions,
    ...vocab.places,
    ...vocab.resources,
    ...vocab.actors,
  ]
  return all.find((e) => e.code === code)?.id
}