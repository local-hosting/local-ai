import { postLlamaChatCompletions } from '../runtime/llama-loopback.js'
import { buildComposeResponseSchema } from './dynamic-schema.js'
import { buildComposeMessages } from './prompt.js'
import type { ComposeRequest, PerActorIntent } from '../types/compose.js'
import type { ModelEntry } from '../types/manifest.js'

export type LlamaClientOptions = {
  baseUrl: string
  model: string
  timeoutMs: number
}

export type LlamaComposeResult =
  | { ok: true; per_actor: PerActorIntent[]; raw: string }
  | { ok: false; reason: 'timeout' | 'http' | 'parse' | 'empty' }

export async function callLlamaCompose(
  req: ComposeRequest,
  model: ModelEntry,
  options: LlamaClientOptions,
): Promise<LlamaComposeResult> {
  const schema = buildComposeResponseSchema(req.event)
  const body = {
    model: options.model || model.name,
    messages: buildComposeMessages(req.vocab, req.event, {
      resident_text: req.resident_text,
      place_ranking: req.place_ranking,
      question_label: req.question_label,
    }),
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

  try {
    const res = await postLlamaChatCompletions(options.baseUrl, body, {
      timeoutMs: options.timeoutMs,
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
  }
}