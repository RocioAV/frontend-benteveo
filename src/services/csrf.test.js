import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchCsrf, clearCsrf, getCsrfToken } from './csrf.js'

let fetchSpy

beforeEach(() => {
  clearCsrf()
  fetchSpy = vi.spyOn(global, 'fetch')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchCsrf', () => {
  it('reutiliza una única llamada fetch entre dos llamadas', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ csrfToken: 'token-1' }),
    })

    const first = await fetchCsrf()
    const second = await fetchCsrf()

    expect(first).toBe('token-1')
    expect(second).toBe('token-1')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('clearCsrf reinicia la caché y fuerza un nuevo fetch', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ csrfToken: 'token-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ csrfToken: 'token-2' }),
      })

    const first = await fetchCsrf()
    clearCsrf()
    const second = await fetchCsrf()

    expect(first).toBe('token-1')
    expect(second).toBe('token-2')
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(getCsrfToken()).toBe('token-2')
  })

  it('devuelve null cuando el endpoint responde { csrfToken: null } (pre-login)', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ csrfToken: null }),
    })

    const result = await fetchCsrf()

    expect(result).toBeNull()
    expect(getCsrfToken()).toBeNull()
  })
})
