export type UpstreamAiConfig = {
  llamaBaseUrl: string
  glinerBaseUrl: string
  composeTimeoutMs: number
  mapTimeoutMs: number
}

export type ServiceConfig = {
  host: '127.0.0.1'
  port: number
} & UpstreamAiConfig

export function loadUpstreamAiConfig(): UpstreamAiConfig {
  return {
    llamaBaseUrl: process.env.TF_LLAMA_BASE_URL ?? 'http://127.0.0.1:8080',
    glinerBaseUrl: process.env.TF_GLINER_BASE_URL ?? 'http://127.0.0.1:8091',
    composeTimeoutMs: Number(process.env.TF_COMPOSE_TIMEOUT_MS ?? 20_000),
    mapTimeoutMs: Number(process.env.TF_MAP_TIMEOUT_MS ?? 1_000),
  }
}

export function loadConfig(): ServiceConfig {
  return {
    host: '127.0.0.1',
    port: Number(process.env.TF_LOCAL_AI_PORT ?? 8090),
    ...loadUpstreamAiConfig(),
  }
}
