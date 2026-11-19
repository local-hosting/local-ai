export type RatingKind =
  | 'not_here'
  | 'late_or_unhelpful'
  | 'sensor_broken'
  | 'missed_event'
  | 'helpful'

export type CommunityRating = {
  event_id: string
  kind: RatingKind
  /** When the rated intent used these action ids */
  action_ids?: string[]
  place_ids?: string[]
  rated_utc: string
  actor_id?: string
}