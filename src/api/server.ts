import http from 'node:http'
import { verifyManifestFiles, readManifest } from '../manifest.js'
import type { ServiceConfig } from '../config.js'
import { isAuthorized } from './auth.js'
import { assertAllowedBindHost, writeJson } from './http.js'
import {
  createLocalAiRouteContext,
  handleLocalAiRoutes,
  type LocalAiRouteContext,
} from './local-ai-routes.js'

export function manifestVerificationErrors(): string[] {
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
  const ctx: LocalAiRouteContext = createLocalAiRouteContext(startupErrors)

  return http.createServer(async (req, res) => {
    if (!req.url || !req.method) {
      writeJson(res, 400, { error: 'bad request' })
      return
    }

    const url = new URL(req.url, `http://${config.bindHost}:${config.port}`)

    if (!isAuthorized(req, config.apiKey)) {
      writeJson(res, 401, { error: 'unauthorized' })
      return
    }

    const handled = await handleLocalAiRoutes(req, res, url, config, ctx)
    if (handled) {
      return
    }

    writeJson(res, 404, { error: 'not found' })
  })
}

export function startServer(config: ServiceConfig): http.Server {
  assertAllowedBindHost(config.bindHost)
  const errors = manifestVerificationErrors()
  if (process.env.LOCAL_AI_ENFORCE_MANIFEST === '1' && errors.length > 0) {
    throw new Error(`manifest verification failed: ${errors.join('; ')}`)
  }
  const server = createServer(config, errors)
  server.listen(config.port, config.bindHost, () => {
    console.log(`local-ai gateway on http://${config.bindHost}:${config.port}`)
  })
  return server
}