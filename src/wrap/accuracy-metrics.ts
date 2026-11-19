import type { CommunityRating } from '../types/ratings.js'
import type { ComposeIntent } from '../types/compose.js'

export type AccuracySnapshot = {
  ratings_count: number
  negative_count: number
  not_here_rate: number
}

export function summarizeRatings(ratings: CommunityRating[]): AccuracySnapshot {
  const negative = ratings.filter((r) => r.kind !== 'helpful')
  return {
    ratings_count: ratings.length,
    negative_count: negative.length,
    not_here_rate:
      ratings.length === 0
        ? 0
        : ratings.filter((r) => r.kind === 'not_here').length / ratings.length,
  }
}

/** Stub gate: LoRA only when enough ratings and sustained not_here rate. */
export function loraEligible(
  ratings: CommunityRating[],
  minCount = 50,
): boolean {
  if (ratings.length < minCount) return false
  const snap = summarizeRatings(ratings)
  return snap.not_here_rate < 0.5
}

export function intentMatchesRating(
  intent: ComposeIntent,
  rating: CommunityRating,
): boolean {
  if (rating.kind !== 'not_here') return true
  const actions = new Set(intent.per_actor.flatMap((p) => p.action_ids))
  const rated = rating.action_ids ?? []
  return rated.every((id) => actions.has(id))
}