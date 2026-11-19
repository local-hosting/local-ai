import {
  createVocabSnapshot,
  createVocabStore,
  fingerprintEntries,
  resolveCodeById,
  resolveIdByCode,
  snapshotToTable,
  type LocalSymbolTablePack,
  type SymbolTableEntry,
  type VocabSnapshot,
  type VocabStore,
} from '@local-hosting/compose'
import type { Vocabulary } from '../types/vocabulary.js'

export { resolveCodeById, resolveIdByCode }

export function vocabularyEntries(vocab: Vocabulary): SymbolTableEntry[] {
  const entries: SymbolTableEntry[] = []

  const push = (
    kind: SymbolTableEntry['kind'],
    rows: Array<{ id: string; code?: number }>,
  ) => {
    for (const row of rows) {
      if (row.code === undefined) continue
      entries.push({ id: row.id, code: row.code, kind })
    }
  }

  push('event', vocab.events)
  push('action', vocab.actions)
  push('place', vocab.places)
  push('resource', vocab.resources)
  push('actor', vocab.actors)

  return entries
}

/** Content tip for thin frames + pack-announce version (fat/thin alignment). */
export function vocabularyTip(vocab: Vocabulary): string {
  return fingerprintEntries(vocabularyEntries(vocab))
}

export function vocabularyToVocabSnapshot(
  vocab: Vocabulary,
  opts?: { lineage?: string; epoch?: number },
): VocabSnapshot {
  const entries = vocabularyEntries(vocab)
  return createVocabSnapshot({
    lineage: opts?.lineage ?? `vocab:${vocab.vocab_version}`,
    epoch: opts?.epoch ?? 1,
    entries,
    label: vocab.vocab_version,
  })
}

export function vocabularyToVocabStore(
  vocab: Vocabulary,
  opts?: { lineage?: string; epoch?: number },
): VocabStore {
  return createVocabStore(vocabularyToVocabSnapshot(vocab, opts))
}

/**
 * Build a symbol pack from vocab.
 * `vocab_base` is the content fingerprint (thin-pipe tip), not the human label.
 */
export function vocabularyToSymbolTable(vocab: Vocabulary): LocalSymbolTablePack {
  return snapshotToTable(vocabularyToVocabSnapshot(vocab))
}
