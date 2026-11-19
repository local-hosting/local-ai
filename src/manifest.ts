import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ManifestDocument, ModelEntry } from './types/manifest.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(repoRoot, 'models', 'MANIFEST.json')

export function manifestFilePath(): string {
  return manifestPath
}

export function readManifest(): ManifestDocument {
  const raw = readFileSync(manifestPath, 'utf8')
  return JSON.parse(raw) as ManifestDocument
}

export function loadActiveComposerFromManifest(
  doc: ManifestDocument,
): ModelEntry | null {
  const chosen = doc.chosen_composer
  const composers = doc.models.filter((m) => m.role === 'composer')
  if (chosen) {
    const hit = composers.find((m) => m.name === chosen)
    if (hit) return hit
  }
  return composers.find((m) => m.status === 'active') ?? composers[0] ?? null
}

export function loadMapperFromManifest(doc: ManifestDocument): ModelEntry | null {
  return doc.models.find((m) => m.role === 'mapper') ?? null
}

function isRemoteModelUri(uri: string | undefined): boolean {
  if (!uri) return false
  return uri.startsWith('https://') || uri.startsWith('http://')
}

export function verifyManifestFiles(doc: ManifestDocument): string[] {
  const errors: string[] = []
  const modelsDir = path.join(repoRoot, 'models')
  for (const entry of doc.models) {
    if (entry.status === 'todo_jm_licence' || entry.status === 'candidate') {
      continue
    }
    // Hub/remote mappers (e.g. GLiNER2) load via URI, not models/<filename>.
    if (isRemoteModelUri(entry.uri)) {
      continue
    }
    const file = path.join(modelsDir, entry.filename)
    if (!existsSync(file)) {
      errors.push(`missing file ${entry.filename}`)
      continue
    }
    const buf = readFileSync(file)
    const sha = createHash('sha256').update(buf).digest('hex')
    if (sha !== entry.sha256) {
      errors.push(`sha mismatch ${entry.filename}`)
    }
  }
  return errors
}