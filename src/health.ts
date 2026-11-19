import { readManifest, loadActiveComposerFromManifest, loadMapperFromManifest } from './manifest.js'
import type { HealthReport } from './types/health.js'

export type HealthOptions = {
  llamaBaseUrl: string
  glinerBaseUrl: string
  loadedVocabVersion: string | null
}

async function probe(url: string, pathSuffix: string): Promise<boolean> {
  try {
    const root = url.replace(/\/$/, '')
    const res = await fetch(`${root}${pathSuffix}`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

export function rssMb(): number {
  return Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10
}

export async function buildHealthReport(
  options: HealthOptions,
): Promise<HealthReport> {
  let composer = null
  let mapper = null
  try {
    const doc = readManifest()
    composer = loadActiveComposerFromManifest(doc)
    mapper = loadMapperFromManifest(doc)
  } catch {
    // manifest missing in dev
  }

  const llamaOk = await probe(options.llamaBaseUrl, '/health')
  const glinerOk = await probe(options.glinerBaseUrl, '/health')

  return {
    vocab_version: options.loadedVocabVersion,
    composer_model: composer,
    mapper_model: mapper,
    llama_reachable: llamaOk,
    gliner_reachable: glinerOk,
    rss_mb: rssMb(),
  }
}