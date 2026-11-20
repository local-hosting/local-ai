/** Operational env — `LOCAL_AI_*` prefix (organization-neutral). */
export function readLocalAiEnv(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const key = name.startsWith('LOCAL_AI_') ? name : `LOCAL_AI_${name}`
  const value = env[key]?.trim()
  return value || undefined
}

export function readLocalAiEnvString(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return readLocalAiEnv(name, env)
}

export function readLocalAiEnvNumber(
  name: string,
  fallback: number,
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = readLocalAiEnv(name, env)
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}