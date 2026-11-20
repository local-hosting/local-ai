import { postLlamaChatCompletions, type LlamaChatMessage } from '../runtime/llama-loopback.js'
import type { GenerateRequest } from './schemas.js'

export type GenerateOptions = {
  llamaBaseUrl: string
  defaultModel: string
  timeoutMs: number
}

export type GenerateResult = {
  text: string
  model: string
  provider: 'llama'
}

export function buildGenerateMessages(input: GenerateRequest): LlamaChatMessage[] {
  if (input.messages?.length) {
    return input.messages
  }
  const messages: LlamaChatMessage[] = []
  if (input.system?.trim()) {
    messages.push({ role: 'system', content: input.system.trim() })
  }
  messages.push({ role: 'user', content: input.user!.trim() })
  return messages
}

export async function runGenerate(
  input: GenerateRequest,
  options: GenerateOptions,
): Promise<GenerateResult> {
  const model = input.model?.trim() || options.defaultModel
  const messages = buildGenerateMessages(input)
  const res = await postLlamaChatCompletions(
    options.llamaBaseUrl,
    {
      model,
      messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.max_tokens ?? 512,
      stream: false,
    },
    { timeoutMs: options.timeoutMs },
  )

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`llama generate failed: HTTP ${res.status}${detail ? ` — ${detail}` : ''}`)
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = json.choices?.[0]?.message?.content?.trim()
  if (!text) {
    throw new Error('llama returned an empty reply')
  }

  return { text, model, provider: 'llama' }
}