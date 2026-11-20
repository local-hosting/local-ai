#!/usr/bin/env node
/**
 * Print resolved composer fields for shell boot / ops.
 *
 *   node --import tsx scripts/resolve-composer.ts [--name NAME] [--field path|alias|name|filename|uri]
 *
 * Honors LOCAL_AI_COMPOSE_MODEL when --name omitted.
 */
import {
  composerGgufPath,
  composerLlamaAlias,
  readManifest,
  resolveComposer,
} from '../src/manifest.js'

const args = process.argv.slice(2)
let name: string | undefined
let field: 'path' | 'alias' | 'name' | 'filename' | 'uri' = 'path'

for (let i = 0; i < args.length; i += 1) {
  const a = args[i]
  if (a === '--name' && args[i + 1]) {
    name = args[++i]
    continue
  }
  if (a === '--field' && args[i + 1]) {
    const f = args[++i]
    if (
      f === 'path' ||
      f === 'alias' ||
      f === 'name' ||
      f === 'filename' ||
      f === 'uri'
    ) {
      field = f
    } else {
      console.error(`resolve-composer: unknown field ${f}`)
      process.exit(2)
    }
    continue
  }
  if (a && !a.startsWith('-') && !name) {
    name = a
  }
}

const doc = readManifest()
const entry = resolveComposer(doc, { name })
if (!entry) {
  console.error('resolve-composer: no composer in MANIFEST.json')
  process.exit(1)
}

switch (field) {
  case 'path':
    process.stdout.write(`${composerGgufPath(entry)}\n`)
    break
  case 'alias':
    process.stdout.write(`${composerLlamaAlias(entry)}\n`)
    break
  case 'name':
    process.stdout.write(`${entry.name}\n`)
    break
  case 'filename':
    process.stdout.write(`${entry.filename}\n`)
    break
  case 'uri':
    process.stdout.write(`${entry.uri ?? ''}\n`)
    break
  default: {
    const _exhaustive: never = field
    console.error(`resolve-composer: unhandled field ${_exhaustive}`)
    process.exit(2)
  }
}
