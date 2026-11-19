export type TrendKind = 'rising' | 'falling' | 'steady' | 'unknown'

export type EventReport = {
  mapped_ids: string[]
  type: string
}

export type EventSummary = {
  event_id: string
  /** Vocab event id (not the runtime occurrence uuid). */
  event_ref: string
  h3_cell: string
  band: 1 | 2 | 3 | 4
  trend: TrendKind
  sensors_agreeing: number
  started_utc: string
  reports: EventReport[]
  candidate_action_ids: string[]
  candidate_place_ids: string[]
  candidate_resource_ids: string[]
  actors: string[]
}