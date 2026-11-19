import catalog from '../map/map-catalog.json' with { type: 'json' }

export const QUESTION_LABELS = catalog.question_labels
export const REPORT_TYPES = catalog.report_types

export type QuestionLabel = (typeof QUESTION_LABELS)[number]
export type ReportType = (typeof REPORT_TYPES)[number]

export type QuestionMapResult = {
  label: QuestionLabel
  confidence: number
}

export type ReportMapResult = {
  report_type: ReportType
  event_ref: string | null
  place_id: string | null
  confidence: number
}
