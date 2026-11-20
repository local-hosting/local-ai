export type ModelEntry = {
  role: 'composer' | 'mapper'
  name: string
  params: string
  quant: string
  filename: string
  sha256: string
  size_bytes: number
  status?: 'active' | 'candidate' | 'todo_jm_licence'
  uri?: string
  /** Optional llama-server `-a` alias; derived from `name` when omitted. */
  alias?: string
}

export type ManifestDocument = {
  version: 1
  models: ModelEntry[]
  /** Default composer when `LOCAL_AI_COMPOSE_MODEL` is unset. */
  chosen_composer?: string
  /** Suggested swap / eval fallback (not auto-loaded). */
  fallback_composer?: string
}
