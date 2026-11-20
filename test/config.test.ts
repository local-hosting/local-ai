import { afterEach, describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.js'

describe('loadConfig', () => {
  const env = { ...process.env }

  afterEach(() => {
    process.env = { ...env }
  })

  it('defaults bind to loopback and honors PORT', () => {
    delete process.env.LOCAL_AI_BIND_HOST
    process.env.PORT = '11434'
    const config = loadConfig()
    expect(config.bindHost).toBe('127.0.0.1')
    expect(config.port).toBe(11434)
  })

  it('allows mesh bind and LOCAL_AI_MODEL_ALIAS', () => {
    process.env.LOCAL_AI_BIND_HOST = '0.0.0.0'
    process.env.LOCAL_AI_MODEL_ALIAS = 'tenant-model'
    const config = loadConfig()
    expect(config.bindHost).toBe('0.0.0.0')
    expect(config.defaultModel).toBe('tenant-model')
  })

  it('defaults model alias from MANIFEST chosen composer', () => {
    delete process.env.LOCAL_AI_MODEL_ALIAS
    delete process.env.LOCAL_AI_COMPOSE_MODEL
    const config = loadConfig()
    expect(config.defaultModel).toBe('qwen3-0.6b')
  })
})