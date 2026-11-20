import { readLocalAiEnv, readLocalAiEnvNumber } from './runtime/read-env.js'

export type UpstreamAiConfig = {
  llamaBaseUrl: string
  glinerBaseUrl: string
  composeTimeoutMs: number
  mapTimeoutMs: number
  generateTimeoutMs: number
}

export type BindHost = '127.0.0.1' | '0.0.0.0'

export type ServiceConfig = {
  bindHost: BindHost
  port: number
  serviceId: string
  serviceVersion: string
  apiKey?: string
  defaultModel: string
  bootMode?: string
} & UpstreamAiConfig

function parseBindHost(raw: string | undefined): BindHost {
  const value = raw?.trim()
  if (value === '0.0.0.0') return '0.0.0.0'
  return '127.0.0.1'
}

function readServiceVersion(env: NodeJS.ProcessEnv): string {
  return (
    readLocalAiEnv('VERSION', env) ||
    env.npm_package_version?.trim() ||
    '0.0.0'
  )
}

function readDefaultModel(env: NodeJS.ProcessEnv): string {
  return readLocalAiEnv('MODEL_ALIAS', env) || 'qwen2.5-7b'
}

export function loadUpstreamAiConfig(env: NodeJS.ProcessEnv = process.env): UpstreamAiConfig {
  const llamaPort = readLocalAiEnv('LLAMA_PORT', env) ?? '8080'
  const defaultLlama = `http://127.0.0.1:${llamaPort}`
  return {
    llamaBaseUrl: readLocalAiEnv('LLAMA_BASE_URL', env) ?? defaultLlama,
    glinerBaseUrl: readLocalAiEnv('GLINER_BASE_URL', env) ?? 'http://127.0.0.1:8091',
    composeTimeoutMs: readLocalAiEnvNumber('COMPOSE_TIMEOUT_MS', 20_000, env),
    mapTimeoutMs: readLocalAiEnvNumber('MAP_TIMEOUT_MS', 1_000, env),
    generateTimeoutMs: readLocalAiEnvNumber('GENERATE_TIMEOUT_MS', 600_000, env),
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServiceConfig {
  const port = Number(env.PORT ?? readLocalAiEnv('PORT', env) ?? 8090)
  return {
    bindHost: parseBindHost(readLocalAiEnv('BIND_HOST', env)),
    port,
    serviceId: readLocalAiEnv('SERVICE_ID', env) || 'local-ai',
    serviceVersion: readServiceVersion(env),
    apiKey: readLocalAiEnv('API_KEY', env),
    defaultModel: readDefaultModel(env),
    bootMode: readLocalAiEnv('BOOT_MODE', env),
    ...loadUpstreamAiConfig(env),
  }
}