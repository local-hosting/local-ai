import type { EventSummary } from '../types/event-summary.js'

export function buildComposeResponseSchema(event: EventSummary): Record<string, unknown> {
  return {
    type: 'object',
    required: ['per_actor'],
    additionalProperties: false,
    properties: {
      per_actor: {
        type: 'array',
        items: {
          type: 'object',
          required: ['actor_id', 'severity', 'action_ids'],
          additionalProperties: false,
          properties: {
            actor_id: { type: 'string', enum: [...event.actors] },
            severity: { type: 'integer', enum: [1, 2, 3, 4] },
            action_ids: {
              type: 'array',
              minItems: 1,
              maxItems: 3,
              items: { type: 'string', enum: [...event.candidate_action_ids] },
            },
            place_ids: {
              type: 'array',
              maxItems: 2,
              items: {
                type: 'string',
                enum:
                  event.candidate_place_ids.length > 0
                    ? [...event.candidate_place_ids]
                    : ['__none__'],
              },
            },
            resource_ids: {
              type: 'array',
              maxItems: 2,
              items: {
                type: 'string',
                enum:
                  event.candidate_resource_ids.length > 0
                    ? [...event.candidate_resource_ids]
                    : ['__none__'],
              },
            },
          },
        },
      },
    },
  }
}