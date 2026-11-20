import type http from 'node:http'

export function readBearerToken(req: http.IncomingMessage): string | undefined {
  const header = req.headers.authorization?.trim()
  if (!header) return undefined
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match?.[1]?.trim() || undefined
}

export function isAuthorized(req: http.IncomingMessage, apiKey: string | undefined): boolean {
  if (!apiKey?.trim()) return true
  return readBearerToken(req) === apiKey.trim()
}