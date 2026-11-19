import { z } from 'zod'
import { SUPPORTED_LANGUAGES } from '../types/vocabulary.js'

const langEnum = z.enum(SUPPORTED_LANGUAGES)

const langLabels = z
  .object(
    Object.fromEntries(SUPPORTED_LANGUAGES.map((lang) => [lang, z.string().optional()])) as Record<
      (typeof SUPPORTED_LANGUAGES)[number],
      z.ZodOptional<z.ZodString>
    >,
  )
  .partial()

const labeledId = z.object({
  id: z.string().min(1),
  code: z.number().int().min(0).max(65535).optional(),
  labels: langLabels,
})

export const vocabularySchema = z.object({
  vocab_version: z.string(),
  languages: z.array(langEnum),
  events: z.array(labeledId),
  actions: z.array(labeledId.extend({ events: z.array(z.string()) })),
  places: z.array(
    labeledId.extend({ type: z.string(), h3: z.string(), wire_code: z.string().optional() }),
  ),
  resources: z.array(
    labeledId.extend({
      place_id: z.string().optional(),
      wire_code: z.string().optional(),
      category: z.string().optional(),
      subcategory: z.string().optional(),
    }),
  ),
  actors: z.array(labeledId),
  defaults: z.record(z.record(z.array(z.string()))),
})

export const eventSummarySchema = z.object({
  event_id: z.string().uuid(),
  event_ref: z.string(),
  h3_cell: z.string(),
  band: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  trend: z.enum(['rising', 'falling', 'steady', 'unknown']),
  sensors_agreeing: z.number().int().nonnegative(),
  started_utc: z.string(),
  reports: z.array(
    z.object({
      mapped_ids: z.array(z.string()),
      type: z.string(),
    }),
  ),
  candidate_action_ids: z.array(z.string()).min(1),
  candidate_place_ids: z.array(z.string()),
  candidate_resource_ids: z.array(z.string()),
  actors: z.array(z.string()).min(1),
})

export const communityRatingSchema = z.object({
  event_id: z.string(),
  kind: z.enum([
    'not_here',
    'late_or_unhelpful',
    'sensor_broken',
    'missed_event',
    'helpful',
  ]),
  action_ids: z.array(z.string()).optional(),
  place_ids: z.array(z.string()).optional(),
  rated_utc: z.string(),
  actor_id: z.string().optional(),
})

const packModeSchema = z.enum(['daily', 'resilience'])

export const composeRequestSchema = z
  .object({
    vocab: vocabularySchema.optional(),
    vocab_tip: z.string().min(1).optional(),
    pack_mode: packModeSchema.optional(),
    event: eventSummarySchema,
  })
  .refine(
    (data) =>
      data.vocab !== undefined ||
      data.vocab_tip !== undefined ||
      data.pack_mode !== undefined,
    { message: 'vocab, vocab_tip, or pack_mode required' },
  )
