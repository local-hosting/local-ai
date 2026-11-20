import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readLocalAiEnv } from './runtime/read-env.js'
import type { ManifestDocument, ModelEntry } from './types/manifest.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(repoRoot, 'models', 'MANIFEST.json')
const modelsDir = path.join(repoRoot, 'models')

export function manifestFilePath(): string {
  return manifestPath
}

export function modelsDirectory(): string {
  return modelsDir
}

export function readManifest(): ManifestDocument {
  const raw = readFileSync(manifestPath, 'utf8')
  return JSON.parse(raw) as ManifestDocument
}

export function listComposerModels(doc: ManifestDocument): ModelEntry[] {
  return doc.models.filter((m) => m.role === 'composer')
}

/** llama-server `-a` value: explicit `alias`, else strip `-instruct` / `-it`. */
export function composerLlamaAlias(entry: ModelEntry): string {
  const explicit = entry.alias?.trim()
  if (explicit) return explicit
  return entry.name.replace(/-instruct$/i, '').replace(/-it$/i, '')
}

export function composerGgufPath(
  entry: ModelEntry,
  root: string = modelsDir,
): string {
  return path.join(root, entry.filename)
}

export type ResolveComposerOptions = {
  /** Explicit composer name (wins over env / MANIFEST). */
  name?: string
  env?: NodeJS.ProcessEnv
}

/**
 * Pick a composer entry.
 * Priority: `name` → `LOCAL_AI_COMPOSE_MODEL` → `chosen_composer` → `status=active` → first composer.
 */
export function resolveComposer(
  doc: ManifestDocument,
  options: ResolveComposerOptions = {},
): ModelEntry | null {
  const composers = listComposerModels(doc)
  if (composers.length === 0) return null

  const fromOpt = options.name?.trim()
  const fromEnv = readLocalAiEnv('COMPOSE_MODEL', options.env ?? process.env)?.trim()
  const want = fromOpt || fromEnv || doc.chosen_composer?.trim() || ''

  if (want) {
    const hit = composers.find((m) => m.name === want)
    if (hit) return hit
  }

  return composers.find((m) => m.status === 'active') ?? composers[0] ?? null
}

/** Same as `resolveComposer(doc)` (honors `LOCAL_AI_COMPOSE_MODEL`). */
export function loadActiveComposerFromManifest(
  doc: ManifestDocument,
): ModelEntry | null {
  return resolveComposer(doc)
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
