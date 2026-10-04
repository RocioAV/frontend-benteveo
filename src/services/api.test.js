import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import api, { ApiError } from './api.js'

// La caché CSRF se aísla para probar api() de forma unitaria.
vi.mock('./csrf.js', () => ({
  getCsrfToken: () => 'test-csrf-token',
  fetchCsrf: vi.fn(),
  clearCsrf: vi.fn(),
}))

let fetchSpy

beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, 'fetch')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('api', () => {
  it('envía credentials: include en todas las peticiones', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })

    await api('/auth/login', { method: 'POST', body: { email: 'a@b.c', password: 'x' } })

    const [, config] = fetchSpy.mock.calls[0]
    expect(config.credentials).toBe('include')
  })

  it('devuelve null en 204 sin llamar a .json()', async () => {
    const jsonSpy = vi.fn()
    fetchSpy.mockResolvedValue({ ok: true, status: 204, json: jsonSpy })

    const result = await api('/auth/login', {
      method: 'POST',
      body: { email: 'a@b.c', password: 'x' },
    })

    expect(result).toBeNull()
    expect(jsonSpy).not.toHaveBeenCalled()
  })

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'inyecta el header x-csrf-token en %s',
    async (method) => {
      fetchSpy.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })

      await api('/x', { method, body: {} })

      const [, config] = fetchSpy.mock.calls[0]
      expect(config.headers['x-csrf-token']).toBe('test-csrf-token')
    }
  )

  it('no inyecta x-csrf-token en GET', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })

    await api('/x')

    const [, config] = fetchSpy.mock.calls[0]
    expect(config.headers['x-csrf-token']).toBeUndefined()
  })

  it('no setea Content-Type cuando el body es FormData', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })

    const formData = new FormData()
    formData.append('front', 'archivo')
    await api('/verification', { method: 'POST', body: formData })

    const [, config] = fetchSpy.mock.calls[0]
    expect(config.body).toBe(formData)
    expect(config.headers['Content-Type']).toBeUndefined()
  })

  it('mapea 401 AUTH_UNAUTHORIZED por code', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: 'AUTH_UNAUTHORIZED' }),
    })

    await expect(api('/x')).rejects.toMatchObject({
      code: 'AUTH_UNAUTHORIZED',
      status: 401,
    })
  })

  it('mapea 403 CSRF_TOKEN_INVALID por code', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ code: 'CSRF_TOKEN_INVALID' }),
    })

    await expect(api('/x', { method: 'POST', body: {} })).rejects.toMatchObject({
      code: 'CSRF_TOKEN_INVALID',
      status: 403,
    })
  })

  it('mapea 401 AUTH_INVALID_CREDENTIALS por code', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: 'AUTH_INVALID_CREDENTIALS' }),
    })

    await expect(api('/x', { method: 'POST', body: {} })).rejects.toMatchObject({
      code: 'AUTH_INVALID_CREDENTIALS',
      status: 401,
    })
  })

  it('mapea el rechazo de fetch a NETWORK_ERROR con status 0', async () => {
    fetchSpy.mockRejectedValue(new TypeError('network down'))

    await expect(api('/x')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    })
  })

  it('degrada a GENERIC cuando el body de error no tiene code', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'boom' }),
    })

    await expect(api('/x')).rejects.toMatchObject({
      code: 'GENERIC',
      status: 500,
    })
  })

  it('expone fields cuando el backend los devuelve', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        code: 'VALIDATION_ERROR',
        fields: { email: 'inválido' },
      }),
    })

    await expect(api('/x', { method: 'POST', body: {} })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 422,
      fields: { email: 'inválido' },
    })
  })

  it('deja fields en null cuando el error no los incluye', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: 'AUTH_UNAUTHORIZED' }),
    })

    await expect(api('/x')).rejects.toMatchObject({
      code: 'AUTH_UNAUTHORIZED',
      status: 401,
      fields: null,
    })
  })

  it('lanza instancias de ApiError', async () => {
    fetchSpy.mockRejectedValue(new TypeError('network down'))

    const err = await api('/x').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toBeInstanceOf(Error)
  })

  it('lanza INVALID_RESPONSE cuando un 2xx devuelve body no-JSON', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON')
      },
    })

    await expect(api('/x')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
      status: 200,
    })
  })
})
