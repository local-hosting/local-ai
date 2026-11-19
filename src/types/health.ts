import type { ModelEntry } from './manifest.js'

export type HealthReport = {
  vocab_version: string | null
  composer_model: ModelEntry | null
  mapper_model: ModelEntry | null
  llama_reachable: boolean
  gliner_reachable: boolean
  rss_mb: number
}