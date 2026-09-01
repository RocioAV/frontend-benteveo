import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { submitVerification } from './verification.service.js'

// La caché CSRF se aísla para verificar la inyección del header por el wrapper api().
vi.mock('./csrf.js', () => ({
  getCsrfToken: () => 'token-verif',
  fetchCsrf: vi.fn(),
  clearCsrf: vi.fn(),
}))

let fetchSpy

beforeEach(() => {
  fetchSpy = vi.spyOn(global, 'fetch')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('submitVerification', () => {
  it('envía FormData sin header Content-Type manual', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })

    const file = new File(['contenido'], 'frente.jpg', { type: 'image/jpeg' })
    await submitVerification({ front: file, back: null, selfie: null })

    const [, config] = fetchSpy.mock.calls[0]
    expect(config.body).toBeInstanceOf(FormData)
    expect(config.headers).not.toHaveProperty('Content-Type')
    expect(config.headers['Content-Type']).toBeUndefined()
  })

  it('incluye el header x-csrf-token y credentials: include', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })

    await submitVerification({ front: null, back: null, selfie: null })

    const [, config] = fetchSpy.mock.calls[0]
    expect(config.headers['x-csrf-token']).toBe('token-verif')
    expect(config.credentials).toBe('include')
  })
})
