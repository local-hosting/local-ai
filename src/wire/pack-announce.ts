import type { PackDeltaFrame, PackDeltaUpdate } from '../types/wire.js'

/**
 * Host-specific pack announcement line (sync adapters).
 * Not part of `@local-hosting/compose` — keep host pack announce here.
 *
 * `peer>>pack@version::seq::itemCount|itemId^k=v;…`
 */

export function parsePackDelta(line: string): PackDeltaFrame | null {
  const main = line.trim()
  const [head, updatesRaw] = main.split('|', 2)
  const headMatch = /^([^>]+)>>([^@]+)@([^:]+)::(\d+)::(\d+)$/.exec(head)
  if (!headMatch) return null
  const base: PackDeltaFrame = {
    peer: headMatch[1],
    pack: headMatch[2],
    version: headMatch[3],
    seq: Number(headMatch[4]),
    itemCount: Number(headMatch[5]),
  }
  if (!updatesRaw) return base
  if (updatesRaw.endsWith('-')) {
    base.dropItemId = updatesRaw.slice(0, -1)
    return base
  }
  const updates: PackDeltaUpdate[] = []
  for (const chunk of updatesRaw.split(';')) {
    const caret = chunk.indexOf('^')
    if (caret < 0) continue
    const itemId = chunk.slice(0, caret)
    const rest = chunk.slice(caret + 1)
    if (!itemId || !rest) continue
    const fields: Record<string, string | number> = {}
    for (const pair of rest.split('^')) {
      const eq = pair.indexOf('=')
      if (eq < 0) continue
      const k = pair.slice(0, eq)
      const v = pair.slice(eq + 1)
      const num = Number(v)
      fields[k] = Number.isFinite(num) ? num : v
    }
    updates.push({ itemId, fields })
  }
  base.updates = updates
  return base
}

export function formatPackDelta(frame: PackDeltaFrame): string {
  const head = `${frame.peer}>>${frame.pack}@${frame.version}::${frame.seq}::${frame.itemCount}`
  if (frame.dropItemId) return `${head}|${frame.dropItemId}-`
  if (!frame.updates?.length) return head
  const updates = frame.updates
    .map((u) => {
      const fields = Object.entries(u.fields)
        .map(([k, v]) => `${k}=${v}`)
        .join('^')
      return `${u.itemId}^${fields}`
    })
    .join(';')
  return `${head}|${updates}`
}
