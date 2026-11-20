import type http from 'node:http'
import { compose } from '../compose/compose.js'
import { mapQuestion, mapReport } from '../map/gliner-client.js'
import { composeRequestSchema, vocabularySchema } from '../vocab/schemas.js'
import { buildHealthReport } from '../health.js'
import type { ServiceConfig } from '../config.js'
import type { SupportedLanguage } from '../types/vocabulary.js'
import { registerSessionVocab, resolveSessionVocab } from '../vocab/session-vocab.js'
import { runGenerate } from '../generate/generate.js'
import { generateRequestSchema } from '../generate/schemas.js'
import { readJsonBody, writeJson } from './http.js'
import { serviceInfoBody } from './service-info.js'

export type LocalAiRouteContext = {
  loadedVocabVersion: string | null
  startupErrors: string[]
}

export function createLocalAiRouteContext(startupErrors: string[] = []): LocalAiRouteContext {
  return { loadedVocabVersion: null, startupErrors }
}

/**
 * Handle local-ai HTTP routes. Returns true when the request was handled.
 */
export async function handleLocalAiRoutes(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  config: ServiceConfig,
  ctx: LocalAiRouteContext,
  options: { includeRoot?: boolean; includeHealth?: boolean } = {},
): Promise<boolean> {
  const { includeRoot = true, includeHealth = true } = options

  if (includeRoot && req.method === 'GET' && url.pathname === '/') {
    writeJson(
      res,
      200,
      serviceInfoBody({
        serviceId: config.serviceId,
        version: config.serviceVersion,
        bootMode: config.bootMode,
      }),
    )
    return true
  }

  if (includeHealth && req.method === 'GET' && url.pathname === '/health') {
    const report = await buildHealthReport({
      llamaBaseUrl: config.llamaBaseUrl,
      glinerBaseUrl: config.glinerBaseUrl,
      loadedVocabVersion: ctx.loadedVocabVersion,
    })
    const status = report.llama_reachable ? 200 : 503
    writeJson(res, status, {
      ok: report.llama_reachable,
      ...report,
      manifest_verification_errors: ctx.startupErrors,
    })
    return true
  }

  if (req.method === 'POST' && url.pathname === '/generate') {
    try {
      const body = await readJsonBody(req)
      const parsed = generateRequestSchema.safeParse(body)
      if (!parsed.success) {
        writeJson(res, 400, { error: 'invalid body', details: parsed.error.flatten() })
        return true
      }
      const result = await runGenerate(parsed.data, {
        llamaBaseUrl: config.llamaBaseUrl,
        defaultModel: config.defaultModel,
        timeoutMs: config.generateTimeoutMs,
      })
      writeJson(res, 200, result)
    } catch (e) {
      writeJson(res, 500, { error: e instanceof Error ? e.message : 'generate failed' })
    }
    return true
  }

  if (req.method === 'POST' && url.pathname === '/compose') {
    try {
      const body = await readJsonBody(req)
      const parsed = composeRequestSchema.safeParse(body)
      if (!parsed.success) {
        writeJson(res, 400, { error: 'invalid body', details: parsed.error.flatten() })
        return true
      }
      const vocab = resolveSessionVocab(parsed.data)
      if (!vocab) {
        writeJson(res, 400, { error: 'unknown vocab_tip; POST vocab first or send vocab body' })
        return true
      }
      ctx.loadedVocabVersion = vocab.vocab_version
      const intent = await compose(
        { vocab, event: parsed.data.event },
        {
          llamaBaseUrl: config.llamaBaseUrl,
          timeoutMs: config.composeTimeoutMs,
        },
      )
      writeJson(res, 200, intent)
    } catch (e) {
      writeJson(res, 500, { error: e instanceof Error ? e.message : 'compose failed' })
    }
    return true
  }

  if (req.method === 'POST' && url.pathname === '/map/question') {
    try {
      const body = (await readJsonBody(req)) as { text?: string; lang?: SupportedLanguage }
      if (!body.text || !body.lang) {
        writeJson(res, 400, { error: 'text and lang required' })
        return true
      }
      const result = await mapQuestion(body.text, body.lang, {
        baseUrl: config.glinerBaseUrl,
        timeoutMs: config.mapTimeoutMs,
      })
      writeJson(res, 200, result)
    } catch (e) {
      writeJson(res, 500, { error: e instanceof Error ? e.message : 'map question failed' })
    }
    return true
  }

  if (req.method === 'POST' && url.pathname === '/vocab/session') {
    try {
      const body = (await readJsonBody(req)) as { vocab?: unknown }
      const vocabParsed = vocabularySchema.safeParse(body.vocab)
      if (!vocabParsed.success || !vocabParsed.data) {
        writeJson(res, 400, { error: 'vocab required' })
        return true
      }
      const tip = registerSessionVocab(vocabParsed.data)
      writeJson(res, 200, { vocab_tip: tip, vocab_version: vocabParsed.data.vocab_version })
    } catch (e) {
      writeJson(res, 500, { error: e instanceof Error ? e.message : 'vocab session failed' })
    }
    return true
  }

  if (req.method === 'POST' && url.pathname === '/map/report') {
    try {
      const body = (await readJsonBody(req)) as {
        text?: string
        lang?: SupportedLanguage
        vocab?: unknown
        vocab_tip?: string
      }
      if (!body.text || !body.lang) {
        writeJson(res, 400, { error: 'text and lang required' })
        return true
      }
      const vocab = resolveSessionVocab(body)
      if (!vocab) {
        writeJson(res, 400, { error: 'vocab or vocab_tip required' })
        return true
      }
      const result = await mapReport(body.text, body.lang, vocab, {
        baseUrl: config.glinerBaseUrl,
        timeoutMs: config.mapTimeoutMs,
      })
      writeJson(res, 200, result)
    } catch (e) {
      writeJson(res, 500, { error: e instanceof Error ? e.message : 'map report failed' })
    }
    return true
  }

  return false
}