import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildHistory, createSseParser, pageLabel, streamChat } from './gemini'

function sseResponse(events, { status = 200, contentType = 'text/event-stream' } = {}) {
  const body = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('')
  return new Response(body, { status, headers: { 'Content-Type': contentType } })
}

function deltaEvent(text) {
  return { candidates: [{ content: { parts: [{ text }] } }] }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('pageLabel', () => {
  it('mapea las rutas principales a etiquetas legibles', () => {
    expect(pageLabel('/')).toBe('Inicio')
    expect(pageLabel('/explorar')).toBe('Catálogo de productos')
    expect(pageLabel('/detalle/abc-123')).toBe('Ficha de un producto')
    expect(pageLabel('/reservation/abc')).toBe('Formulario de reserva')
    expect(pageLabel('/pago-exitoso')).toBe('Pago exitoso')
    expect(pageLabel('/dashboard')).toBe('Dashboard del usuario')
    expect(pageLabel('/chat/r1')).toBe('Chat de una reserva')
    expect(pageLabel('/publicaciones/abc/editar')).toBe('Editar publicación')
    expect(pageLabel('/login')).toBe('Inicio de sesión')
    expect(pageLabel('/ruta-inexistente')).toBe('Página no encontrada')
  })
})

describe('buildHistory', () => {
  it('descarta los mensajes de error, limita el historial y mapea roles', () => {
    const mensajes = [
      { texto: 'uno', esBot: false },
      { texto: 'dos', esBot: true },
      { texto: 'falla', esBot: true, error: true },
      { texto: 'tres', esBot: false },
      { texto: 'cuatro', esBot: true },
      { texto: 'cinco', esBot: false },
      { texto: 'seis', esBot: true },
      { texto: 'siete', esBot: false },
    ]

    const historial = buildHistory(mensajes, 6)

    expect(historial).toHaveLength(6)
    expect(historial.some((m) => m.text === 'falla')).toBe(false)
    expect(historial[0]).toEqual({ role: 'model', text: 'dos' })
    expect(historial.at(-1)).toEqual({ role: 'user', text: 'siete' })
  })
})

describe('createSseParser', () => {
  it('emite los deltas aunque el evento llegue partido en chunks', () => {
    const onDelta = vi.fn()
    const parser = createSseParser(onDelta)
    const payload = `data: ${JSON.stringify(deltaEvent('Hola '))}\n\ndata: ${JSON.stringify(deltaEvent('mundo'))}\n\n`

    parser.push(payload.slice(0, 12))
    parser.push(payload.slice(12))
    parser.flush()

    expect(onDelta).toHaveBeenCalledTimes(2)
    expect(onDelta).toHaveBeenNthCalledWith(1, 'Hola ')
    expect(onDelta).toHaveBeenNthCalledWith(2, 'mundo')
  })

  it('marca error cuando el backend reporta un fallo en el stream', () => {
    const parser = createSseParser(vi.fn())

    parser.push('data: {"error":"STREAM_INTERRUPTED"}\n\n')

    expect(parser.hasError()).toBe(true)
  })

  it('ignora líneas que no son eventos data', () => {
    const onDelta = vi.fn()
    const parser = createSseParser(onDelta)

    parser.push(': keep-alive\n\n')
    parser.flush()

    expect(onDelta).not.toHaveBeenCalled()
    expect(parser.hasError()).toBe(false)
  })
})

describe('streamChat', () => {
  it('hace POST al proxy, acumula los deltas y devuelve la respuesta completa', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([deltaEvent('Hola '), deltaEvent('vecino')]),
    )
    vi.stubGlobal('fetch', fetchMock)
    const onDelta = vi.fn()

    const resultado = await streamChat({
      message: 'hola',
      history: [{ role: 'user', text: 'previa' }],
      context: { page: 'Inicio' },
      onDelta,
    })

    expect(resultado).toBe('Hola vecino')
    expect(onDelta.mock.calls.map((c) => c[0])).toEqual(['Hola ', 'vecino'])

    const [url, config] = fetchMock.mock.calls[0]
    expect(url).toContain('/ai/chat/stream')
    expect(config.method).toBe('POST')
    expect(config.credentials).toBe('include')
    expect(JSON.parse(config.body)).toEqual({
      message: 'hola',
      history: [{ role: 'user', text: 'previa' }],
      context: { page: 'Inicio' },
    })
  })

  it('devuelve null cuando el backend responde un error HTTP', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{"code":"AI_UNAVAILABLE"}', {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(streamChat({ message: 'hola' })).resolves.toBeNull()
  })

  it('devuelve null cuando la respuesta no es un stream SSE', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        sseResponse([], { contentType: 'application/json' }),
      ),
    )

    await expect(streamChat({ message: 'hola' })).resolves.toBeNull()
  })

  it('devuelve null cuando falla la red', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    )

    await expect(streamChat({ message: 'hola' })).resolves.toBeNull()
  })

  it('devuelve null si el stream reporta error del backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('data: {"error":"STREAM_INTERRUPTED"}\n\n', {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      ),
    )

    await expect(streamChat({ message: 'hola' })).resolves.toBeNull()
  })
})
