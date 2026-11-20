import { describe, expect, it } from 'vitest'
import { serviceInfoBody } from '../src/api/service-info.js'

describe('serviceInfoBody', () => {
  it('reports service id and version', () => {
    const body = serviceInfoBody({
      serviceId: 'local-ai',
      version: '0.1.0',
      bootMode: 'full',
    })
    expect(body).toEqual({
      ok: true,
      service: 'local-ai',
      version: '0.1.0',
      boot_mode: 'full',
    })
  })
})