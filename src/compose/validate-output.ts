import type { EventSummary } from '../types/event-summary.js'
import type { PerActorIntent } from '../types/compose.js'

export type ValidateOutputResult = { ok: true } | { ok: false; reason: string }

function inList(id: string, list: string[]): boolean {
  return list.includes(id)
}

export function validateComposeOutput(
  event: EventSummary,
  per_actor: PerActorIntent[],
): ValidateOutputResult {
  const actorSet = new Set(event.actors)
  const seenActors = new Set<string>()

  for (const row of per_actor) {
    if (!actorSet.has(row.actor_id)) {
      return { ok: false, reason: `invalid actor_id ${row.actor_id}` }
    }
    if (seenActors.has(row.actor_id)) {
      return { ok: false, reason: 'duplicate actor_id' }
    }
    seenActors.add(row.actor_id)

    if (row.severity < event.band - 1) {
      return { ok: false, reason: 'severity too low vs band' }
    }

    for (const actionId of row.action_ids) {
      if (!inList(actionId, event.candidate_action_ids)) {
        return { ok: false, reason: `invalid action_id ${actionId}` }
      }
    }
    for (const placeId of row.place_ids ?? []) {
      if (!inList(placeId, event.candidate_place_ids)) {
        return { ok: false, reason: `invalid place_id ${placeId}` }
      }
    }
    for (const resourceId of row.resource_ids ?? []) {
      if (!inList(resourceId, event.candidate_resource_ids)) {
        return { ok: false, reason: `invalid resource_id ${resourceId}` }
      }
    }
  }

  return { ok: true }
}