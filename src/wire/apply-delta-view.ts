import type { PackDeltaFrame } from '../types/wire.js'

/**
 * In-memory stand-in for a community pack replica after thin-pipe delivery.
 * Host still owns real locker merges — this validates delta semantics.
 */
export type CommunityPackView = Map<string, Record<string, string | number>>

export function createCommunityPackView(
  seed?: Iterable<[string, Record<string, string | number>]>,
): CommunityPackView {
  return new Map(seed)
}

export function applyPackDeltaToView(
  view: CommunityPackView,
  delta: PackDeltaFrame,
): CommunityPackView {
  const next = new Map(view)
  if (delta.dropItemId) {
    next.delete(delta.dropItemId)
    return next
  }
  for (const u of delta.updates ?? []) {
    const prev = next.get(u.itemId) ?? {}
    next.set(u.itemId, { ...prev, ...u.fields })
  }
  return next
}
