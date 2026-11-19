import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@local-hosting/compose'

export { SUPPORTED_LANGUAGES, type SupportedLanguage }

export type LabeledId = {
  id: string
  /** Compact wire code (uint16). */
  code?: number
  labels: Partial<Record<SupportedLanguage, string>>
}

/** Vocab event entry (IDs + i18n + wire code). */
export type VocabEvent = LabeledId

export type VocabAction = LabeledId & {
  events: string[]
}

export type VocabPlace = LabeledId & {
  type: string
  h3: string
}

export type VocabResource = LabeledId & {
  place_id: string
}

export type VocabActor = LabeledId

/** event vocab id → band → action ids */
export type VocabDefaults = Record<string, Record<string, string[]>>

export type Vocabulary = {
  vocab_version: string
  languages: SupportedLanguage[]
  events: VocabEvent[]
  actions: VocabAction[]
  places: VocabPlace[]
  resources: VocabResource[]
  actors: VocabActor[]
  defaults: VocabDefaults
}
