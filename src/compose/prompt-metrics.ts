import type { EventSummary } from '../types/event-summary.js'
import type { Vocabulary } from '../types/vocabulary.js'
import { buildComposeMessages } from './prompt.js'

/** Rough prompt size for Pi/mobile budgeting (chars ÷ 4 ≈ English BPE tokens). */
export function estimateComposePromptTokens(
  vocab: Vocabulary,
  event: EventSummary,
): { tokens_est: number; chars: number } {
  const messages = buildComposeMessages(vocab, event)
  const chars = messages.reduce((n, m) => n + m.content.length, 0)
  const tokens_est = Math.ceil(chars / 4)
  return { tokens_est, chars }
}

export { buildComposeMessages } from './prompt.js'