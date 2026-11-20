import { z } from 'zod'

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
})

export const generateRequestSchema = z
  .object({
    model: z.string().min(1).optional(),
    system: z.string().optional(),
    user: z.string().optional(),
    messages: z.array(messageSchema).min(1).optional(),
    max_tokens: z.number().int().min(1).max(32_768).optional(),
    temperature: z.number().min(0).max(2).optional(),
    stream: z.boolean().optional(),
  })
  .superRefine((body, ctx) => {
    const hasMessages = Boolean(body.messages?.length)
    const hasUser = Boolean(body.user?.trim())
    if (!hasMessages && !hasUser) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'messages or user is required',
      })
    }
    if (body.stream) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'stream is not supported on /generate yet',
      })
    }
  })

export type GenerateRequest = z.infer<typeof generateRequestSchema>