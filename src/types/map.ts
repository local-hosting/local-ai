export type QuestionLabel =
  | 'where_to_go'
  | 'what_to_do'
  | 'how_long'
  | 'is_it_safe_for_kids'
  | 'is_it_safe_outside'
  | 'other'

export type ReportType =
  | 'worse_here'
  | 'better_here'
  | 'sensor_broken'
  | 'need_help'
  | 'im_safe'
  | 'other'

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