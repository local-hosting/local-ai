import http from 'node:http'
import { compose } from '../compose/compose.js'
import { mapQuestion, mapReport } from '../map/gliner-client.js'
import { composeRequestSchema, vocabularySchema } from '../vocab/schemas.js'
import { buildHealthReport } from '../health.js'
import { verifyManifestFiles, readManifest } from '../manifest.js'
import type { ServiceConfig } from '../config.js'
import type { SupportedLanguage } from '../types/vocabulary.js'
import { registerSessionVocab, resolveSessionVocab } from '../vocab/session-vocab.js'
import { assertLoopbackHost, readJsonBody, writeJson } from './http.js'

function manifestVerificationErrors(): string[] {
  try {
    return verifyManifestFiles(readManifest())
  } catch {
    return []
  }
}

export function createServer(
  config: ServiceConfig,
  startupErrors: string[] = manifestVerificationErrors(),
): http.Server {
  let loadedVocabVersion: string | null = null

  return http.createServer(async (req, res) => {
    if (!req.url || !req.method) {
      writeJson(res, 400, { error: 'bad request' })
      return
    }

    const url = new URL(req.url, `http://${config.host}:${config.port}`)

    if (req.method === 'GET' && url.pathname === '/health') {
      const report = await buildHealthReport({
        llamaBaseUrl: config.llamaBaseUrl,
        glinerBaseUrl: config.glinerBaseUrl,
        loadedVocabVersion,
      })
      writeJson(res, 200, {
        ...report,
        manifest_verification_errors: startupErrors,
      })
      return
    }

    if (req.method === 'POST' && url.pathname === '/compose') {
      try {
        const body = await readJsonBody(req)
        const parsed = composeRequestSchema.safeParse(body)
        if (!parsed.success) {
          writeJson(res, 400, { error: 'invalid body', details: parsed.error.flatten() })
          return
        }
        const vocab = resolveSessionVocab(parsed.data)
        if (!vocab) {
          writeJson(res, 400, { error: 'unknown vocab_tip; POST vocab first or send vocab body' })
          return
        }
        loadedVocabVersion = vocab.vocab_version
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
      return
    }

    if (req.method === 'POST' && url.pathname === '/map/question') {
      try {
        const body = (await readJsonBody(req)) as { text?: string; lang?: SupportedLanguage }
        if (!body.text || !body.lang) {
          writeJson(res, 400, { error: 'text and lang required' })
          return
        }
        const result = await mapQuestion(body.text, body.lang, {
          baseUrl: config.glinerBaseUrl,
          timeoutMs: config.mapTimeoutMs,
        })
        writeJson(res, 200, result)
      } catch (e) {
        writeJson(res, 500, { error: e instanceof Error ? e.message : 'map question failed' })
      }
      return
    }

    if (req.method === 'POST' && url.pathname === '/vocab/session') {
      try {
        const body = (await readJsonBody(req)) as { vocab?: unknown }
        const vocabParsed = vocabularySchema.safeParse(body.vocab)
        if (!vocabParsed.success || !vocabParsed.data) {
          writeJson(res, 400, { error: 'vocab required' })
          return
        }
        const tip = registerSessionVocab(vocabParsed.data)
        writeJson(res, 200, { vocab_tip: tip, vocab_version: vocabParsed.data.vocab_version })
      } catch (e) {
        writeJson(res, 500, { error: e instanceof Error ? e.message : 'vocab session failed' })
      }
      return
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
          return
        }
        const vocab = resolveSessionVocab(body)
        if (!vocab) {
          writeJson(res, 400, { error: 'vocab or vocab_tip required' })
          return
        }
        const result = await mapReport(body.text, body.lang, vocab, {
          baseUrl: config.glinerBaseUrl,
          timeoutMs: config.mapTimeoutMs,
        })
        writeJson(res, 200, result)
      } catch (e) {
        writeJson(res, 500, { error: e instanceof Error ? e.message : 'map report failed' })
      }
      return
    }

    writeJson(res, 404, { error: 'not found' })
  })
}

export function startServer(config: ServiceConfig): http.Server {
  assertLoopbackHost(config.host)
  const errors = manifestVerificationErrors()
  if (process.env.TF_ENFORCE_MANIFEST === '1' && errors.length > 0) {
    throw new Error(`manifest verification failed: ${errors.join('; ')}`)
  }
  const server = createServer(config, errors)
  server.listen(config.port, config.host, () => {
    console.log(`ai listening on http://${config.host}:${config.port}`)
  })
  return server
}

