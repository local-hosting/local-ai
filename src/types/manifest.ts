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
}

export type ManifestDocument = {
  version: 1
  models: ModelEntry[]
  chosen_composer?: string
}