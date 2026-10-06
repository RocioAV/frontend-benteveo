import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildWsUrl,
  ChatClient,
  fetchMessages,
  normalizeMessages,
} from './chat.service.js'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))

vi.mock('./api', () => ({
  default: apiMock,
}))

class FakeWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 3
  static instances = []

  constructor(url, ...protocols) {
    this.url = url
    this.protocols = protocols
    this.readyState = FakeWebSocket.CONNECTING
    this.sent = []
    FakeWebSocket.instances.push(this)
  }

  send(payload) {
    this.sent.push(payload)
  }

  open() {
    this.readyState = FakeWebSocket.OPEN
    this.onopen?.()
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.()
  }
}

beforeEach(() => {
  apiMock.mockReset()
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('chat.service', () => {
  it('uses an explicit WebSocket URL with the chat path', () => {
    vi.stubEnv('VITE_WS_URL', 'wss://chat.example.test/api/v1/chat')

    expect(buildWsUrl()).toBe('wss://chat.example.test/api/v1/chat')
  })

  it('derives the WebSocket URL without dropping the API path', () => {
    vi.stubEnv('VITE_WS_URL', '')
    vi.stubEnv('VITE_API_URL', 'https://api.example.test/api/v1/')

    expect(buildWsUrl()).toBe('wss://api.example.test/api/v1/chat')
  })

  it('uses the safe local path when the API URL is unavailable', () => {
    vi.stubEnv('VITE_WS_URL', '')
    vi.stubEnv('VITE_API_URL', 'api_backend')

    expect(buildWsUrl()).toBe('ws://localhost:3000/api/v1/chat')
  })

  it('normalizes array and envelope history responses', () => {
    const messages = [{ id: 'message-1' }]

    expect(normalizeMessages(messages)).toBe(messages)
    expect(normalizeMessages({ messages })).toBe(messages)
    expect(normalizeMessages({ data: messages })).toEqual([])
  })

  it('loads and normalizes REST history', async () => {
    const messages = [{ id: 'message-1' }]
    apiMock.mockResolvedValue({ messages })

    await expect(fetchMessages('reservation-1')).resolves.toEqual(messages)
    expect(apiMock).toHaveBeenCalledWith('/reservations/reservation-1/messages')
  })

  it('opens without a JWT subprotocol, sends a client id, and rejoins after reconnecting', () => {
    vi.useFakeTimers()
    vi.stubEnv('VITE_WS_URL', 'wss://api.example.test/api/v1/chat')
    const onStatus = vi.fn()
    const client = new ChatClient({ onStatus })

    client.join('reservation-1')
    client.connect()

    const firstSocket = FakeWebSocket.instances[0]
    expect(firstSocket.url).toBe('wss://api.example.test/api/v1/chat')
    expect(firstSocket.protocols).toEqual([])

    firstSocket.open()
    expect(JSON.parse(firstSocket.sent[0])).toEqual({
      type: 'join',
      reservationId: 'reservation-1',
    })

    expect(client.send('reservation-1', 'Hola', 'client-1')).toBe('client-1')
    expect(JSON.parse(firstSocket.sent[1])).toEqual({
      type: 'message:send',
      reservationId: 'reservation-1',
      content: 'Hola',
      clientMessageId: 'client-1',
    })

    firstSocket.close()
    vi.advanceTimersByTime(1000)

    const secondSocket = FakeWebSocket.instances[1]
    secondSocket.open()
    expect(JSON.parse(secondSocket.sent[0])).toEqual({
      type: 'join',
      reservationId: 'reservation-1',
    })
    expect(onStatus).toHaveBeenCalledWith('reconnecting')
  })

  it('uses inquiry events and rejoins the inquiry after reconnecting', () => {
    vi.useFakeTimers()
    vi.stubEnv('VITE_WS_URL', 'wss://api.example.test/api/v1/chat')
    const client = new ChatClient({ targetType: 'inquiry' })

    client.join('inquiry-1')
    client.connect()

    const firstSocket = FakeWebSocket.instances[0]
    firstSocket.open()
    expect(JSON.parse(firstSocket.sent[0])).toEqual({
      type: 'inquiry:join',
      inquiryId: 'inquiry-1',
    })

    expect(client.send('inquiry-1', '¿Está disponible?', 'client-2')).toBe('client-2')
    expect(JSON.parse(firstSocket.sent[1])).toEqual({
      type: 'inquiry:message:send',
      inquiryId: 'inquiry-1',
      content: '¿Está disponible?',
      clientMessageId: 'client-2',
    })

    firstSocket.close()
    vi.advanceTimersByTime(1000)

    const secondSocket = FakeWebSocket.instances[1]
    secondSocket.open()
    expect(JSON.parse(secondSocket.sent[0])).toEqual({
      type: 'inquiry:join',
      inquiryId: 'inquiry-1',
    })
  })
})
