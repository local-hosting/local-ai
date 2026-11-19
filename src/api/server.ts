import http from 'node:http'
import { compose } from '../compose/compose.js'
import { mapQuestion, mapReport } from '../map/gliner-client.js'
import { composeRequestSchema } from '../vocab/schemas.js'
import { buildHealthReport } from '../health.js'
import { verifyManifestFiles, readManifest } from '../manifest.js'
import type { ServiceConfig } from '../config.js'
import type { SupportedLanguage } from '../types/vocabulary.js'

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  return JSON.parse(raw) as unknown
}

export function createServer(config: ServiceConfig): http.Server {
  let loadedVocabVersion: string | null = null

  const startupErrors = (() => {
    try {
      const doc = readManifest()
      return verifyManifestFiles(doc)
    } catch {
      return [] as string[]
    }
  })()

  return http.createServer(async (req, res) => {
    if (!req.url || !req.method) {
      json(res, 400, { error: 'bad request' })
      return
    }

    const url = new URL(req.url, `http://${config.host}:${config.port}`)

    if (req.method === 'GET' && url.pathname === '/health') {
      const report = await buildHealthReport({
        llamaBaseUrl: config.llamaBaseUrl,
        glinerBaseUrl: config.glinerBaseUrl,
        loadedVocabVersion,
      })
      json(res, 200, {
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
          json(res, 400, { error: 'invalid body', details: parsed.error.flatten() })
          return
        }
        loadedVocabVersion = parsed.data.vocab.vocab_version
        const intent = await compose(parsed.data, {
          llamaBaseUrl: config.llamaBaseUrl,
          timeoutMs: config.composeTimeoutMs,
        })
        json(res, 200, intent)
      } catch (e) {
        json(res, 500, { error: e instanceof Error ? e.message : 'compose failed' })
      }
      return
    }

    if (req.method === 'POST' && url.pathname === '/map/question') {
      try {
        const body = (await readJsonBody(req)) as { text?: string; lang?: SupportedLanguage }
        if (!body.text || !body.lang) {
          json(res, 400, { error: 'text and lang required' })
          return
        }
        const result = await mapQuestion(body.text, body.lang, {
          baseUrl: config.glinerBaseUrl,
          timeoutMs: config.mapTimeoutMs,
        })
        json(res, 200, result)
      } catch (e) {
        json(res, 500, { error: e instanceof Error ? e.message : 'map question failed' })
      }
      return
    }

    if (req.method === 'POST' && url.pathname === '/map/report') {
      try {
        const body = (await readJsonBody(req)) as {
          text?: string
          lang?: SupportedLanguage
          vocab?: unknown
        }
        if (!body.text || !body.lang || !body.vocab) {
          json(res, 400, { error: 'text, lang, vocab required' })
          return
        }
        const vocabParsed = composeRequestSchema.shape.vocab.safeParse(body.vocab)
        if (!vocabParsed.success) {
          json(res, 400, { error: 'invalid vocab' })
          return
        }
        const result = await mapReport(body.text, body.lang, vocabParsed.data, {
          baseUrl: config.glinerBaseUrl,
          timeoutMs: config.mapTimeoutMs,
        })
        json(res, 200, result)
      } catch (e) {
        json(res, 500, { error: e instanceof Error ? e.message : 'map report failed' })
      }
      return
    }

    json(res, 404, { error: 'not found' })
  })
}

export function startServer(config: ServiceConfig): http.Server {
  if (config.host !== '127.0.0.1') {
    throw new Error('must bind 127.0.0.1 only')
  }
  const errors = (() => {
    try {
      return verifyManifestFiles(readManifest())
    } catch {
      return []
    }
  })()
  if (process.env.TF_ENFORCE_MANIFEST === '1' && errors.length > 0) {
    throw new Error(`manifest verification failed: ${errors.join('; ')}`)
  }
  const server = createServer(config)
  server.listen(config.port, config.host, () => {
    console.log(`ai listening on http://${config.host}:${config.port}`)
  })
  return server
}