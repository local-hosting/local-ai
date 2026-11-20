export function normalizeLlamaLoopbackBase(baseUrl: string): string {
  const url = new URL(baseUrl)
  if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
    throw new Error('llama base URL must be loopback')
  }
  return url.toString().replace(/\/$/, '')
}

export type LlamaChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type LlamaChatCompletionBody = {
  model: string
  messages: LlamaChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
  response_format?: unknown
  chat_template_kwargs?: Record<string, unknown>
}

export type LlamaChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>
}

/** Loopback-only chat completions (llama-server wire — not exposed on the mesh). */
export async function postLlamaChatCompletions(
  baseUrl: string,
  body: LlamaChatCompletionBody,
  options: { timeoutMs: number; signal?: AbortSignal },
): Promise<Response> {
  const root = normalizeLlamaLoopbackBase(baseUrl)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs)
  const signal = options.signal ?? controller.signal
  try {
    return await fetch(`${root}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } finally {
    clearTimeout(timer)
  }
}