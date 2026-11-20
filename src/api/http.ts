import type http from 'node:http'

export function writeJson(
  res: http.ServerResponse,
  status: number,
  body: unknown,
): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

export async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  return JSON.parse(raw) as unknown
}

import type { BindHost } from '../config.js'

export function assertAllowedBindHost(host: string): asserts host is BindHost {
  if (host !== '127.0.0.1' && host !== '0.0.0.0') {
    throw new Error('bind host must be 127.0.0.1 or 0.0.0.0')
  }
}
