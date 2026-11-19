import { buildComposeResponseSchema } from './dynamic-schema.js'
import { buildComposeMessages } from './prompt.js'
import type { EventSummary } from '../types/event-summary.js'
import type { PerActorIntent } from '../types/compose.js'
import type { Vocabulary } from '../types/vocabulary.js'
import type { ModelEntry } from '../types/manifest.js'

export type LlamaClientOptions = {
  baseUrl: string
  model: string
  timeoutMs: number
}

export type LlamaComposeResult =
  | { ok: true; per_actor: PerActorIntent[]; raw: string }
  | { ok: false; reason: 'timeout' | 'http' | 'parse' | 'empty' }

function normalizeLoopback(baseUrl: string): string {
  const url = new URL(baseUrl)
  if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
    throw new Error('llama base URL must be loopback')
  }
  return url.toString().replace(/\/$/, '')
}

export async function callLlamaCompose(
  vocab: Vocabulary,
  event: EventSummary,
  model: ModelEntry,
  options: LlamaClientOptions,
): Promise<LlamaComposeResult> {
  const root = normalizeLoopback(options.baseUrl)
  const schema = buildComposeResponseSchema(event)
  const body = {
    model: options.model || model.name,
    messages: buildComposeMessages(vocab, event),
    temperature: 0,
    max_tokens: 512,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'intent',
        strict: true,
        schema,
      },
    },
    chat_template_kwargs: { enable_thinking: false },
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs)
  try {
    const res = await fetch(`${root}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) return { ok: false, reason: 'http' }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content
    if (!content?.trim()) return { ok: false, reason: 'empty' }
    const parsed = JSON.parse(content) as { per_actor: PerActorIntent[] }
    return { ok: true, per_actor: parsed.per_actor, raw: content }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, reason: 'timeout' }
    }
    return { ok: false, reason: 'parse' }
  } finally {
    clearTimeout(timer)
  }
}