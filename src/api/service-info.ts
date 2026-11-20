export type ServiceInfoBody = {
  ok: true
  service: string
  version: string
  boot_mode?: string
}

export function serviceInfoBody(input: {
  serviceId: string
  version: string
  bootMode?: string
}): ServiceInfoBody {
  return {
    ok: true,
    service: input.serviceId,
    version: input.version,
    ...(input.bootMode ? { boot_mode: input.bootMode } : {}),
  }
}