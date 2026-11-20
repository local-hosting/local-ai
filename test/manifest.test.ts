import { afterEach, describe, expect, it } from 'vitest'
import {
  composerGgufPath,
  composerLlamaAlias,
  listComposerModels,
  readManifest,
  resolveComposer,
} from '../src/manifest.js'

describe('resolveComposer', () => {
  const envSnapshot = { ...process.env }

  afterEach(() => {
    process.env = { ...envSnapshot }
  })

  it('defaults to chosen_composer from MANIFEST', () => {
    delete process.env.LOCAL_AI_COMPOSE_MODEL
    const doc = readManifest()
    const entry = resolveComposer(doc)
    expect(entry?.name).toBe(doc.chosen_composer)
    expect(entry?.status).toBe('active')
  })

  it('honors LOCAL_AI_COMPOSE_MODEL override', () => {
    process.env.LOCAL_AI_COMPOSE_MODEL = 'qwen2.5-1.5b-instruct'
    const entry = resolveComposer(readManifest())
    expect(entry?.name).toBe('qwen2.5-1.5b-instruct')
  })

  it('explicit name wins over env', () => {
    process.env.LOCAL_AI_COMPOSE_MODEL = 'qwen2.5-1.5b-instruct'
    const entry = resolveComposer(readManifest(), {
      name: 'gemma-2-2b-it',
    })
    expect(entry?.name).toBe('gemma-2-2b-it')
  })

  it('derives llama aliases', () => {
    const composers = listComposerModels(readManifest())
    const byName = Object.fromEntries(composers.map((m) => [m.name, m]))
    expect(composerLlamaAlias(byName['qwen3-0.6b-instruct']!)).toBe('qwen3-0.6b')
    expect(composerLlamaAlias(byName['gemma-2-2b-it']!)).toBe('gemma-2-2b')
    expect(composerLlamaAlias(byName['gemma-4-e2b']!)).toBe('gemma-4-e2b')
  })

  it('builds gguf paths under models/', () => {
    const entry = resolveComposer(readManifest())!
    expect(composerGgufPath(entry).endsWith(entry.filename)).toBe(true)
  })
})
