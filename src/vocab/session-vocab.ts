import { resolvePackId, type PackMode } from '@local-hosting/compose'
import { loadPack } from '@local-hosting/vocab'
import type { Vocabulary } from '../types/vocabulary.js'
import { vocabularyTip } from './symbol-table.js'
import { vocabularySchema } from './schemas.js'

const byTip = new Map<string, Vocabulary>()

export type SessionVocabInput = {
  vocab?: unknown
  vocab_tip?: string
  pack_mode?: PackMode
}

export function registerSessionVocab(vocab: Vocabulary): string {
  const tip = vocabularyTip(vocab)
  byTip.set(tip, vocab)
  return tip
}

export function getSessionVocab(vocab_tip: string): Vocabulary | undefined {
  return byTip.get(vocab_tip)
}

export function resolveSessionVocab(input: SessionVocabInput): Vocabulary | null {
  if (input.vocab !== undefined) {
    const parsed = vocabularySchema.safeParse(input.vocab)
    if (!parsed.success) return null
    registerSessionVocab(parsed.data)
    return parsed.data
  }
  if (input.vocab_tip) return getSessionVocab(input.vocab_tip) ?? null
  if (input.pack_mode) return loadPack(resolvePackId(input.pack_mode))
  return null
}