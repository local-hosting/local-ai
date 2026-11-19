export type ElevationDenyReason =
  | 'raw_payload'
  | 'unsealed_items'
  | 'duckdb_path'
  | 'missing_vocab'
  | 'missing_candidates'