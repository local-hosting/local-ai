import { describe, expect, it } from 'vitest'
import { buildGenerateMessages } from '../src/generate/generate.js'
import { generateRequestSchema } from '../src/generate/schemas.js'

describe('generateRequestSchema', () => {
  it('accepts user shorthand', () => {
    const parsed = generateRequestSchema.safeParse({ user: 'hello' })
    expect(parsed.success).toBe(true)
  })

  it('rejects stream for now', () => {
    const parsed = generateRequestSchema.safeParse({ user: 'hi', stream: true })
    expect(parsed.success).toBe(false)
  })
})

describe('buildGenerateMessages', () => {
  it('builds system + user', () => {
    expect(
      buildGenerateMessages({ system: 'sys', user: 'question' }),
    ).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'question' },
    ])
  })
})