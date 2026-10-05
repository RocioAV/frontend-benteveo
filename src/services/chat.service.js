// Adapter de chat por reserva: WebSocket nativo + historial REST.
// La sesión se autentica con la cookie del navegador durante el handshake.

import apiClient from './api'

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 10000

// Deriva la URL del WebSocket desde la URL del API REST (mismo host, otro esquema).
// Override explícito con VITE_WS_URL cuando el gateway vive en otro host.
export function buildWsUrl() {
  const explicit = import.meta.env.VITE_WS_URL?.trim()
  if (explicit) return explicit

  const api = import.meta.env.VITE_API_URL
  try {
    const url = new URL(api)
    const proto = url.protocol === 'https:' ? 'wss' : 'ws'
    const apiPath = url.pathname.replace(/\/+$/, '') || '/api/v1'
    return `${proto}://${url.host}${apiPath}/chat`
  } catch {
    return 'ws://localhost:3000/api/v1/chat'
  }
}

export function normalizeMessages(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.messages)) return data.messages
  return []
}

// Historial de mensajes de una reserva (REST, fallback de la carga inicial).
// Forward-compatible: si el endpoint aún no existe en el backend, devuelve [].
export async function fetchMessages(reservationId) {
  try {
    const data = await apiClient(`/reservations/${reservationId}/messages`)
    return normalizeMessages(data)
  } catch {
    return []
  }
}

export function createClientMessageId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `client-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Cliente de chat por reserva con reconexión exponencial y re-join automático.
 *
 * @param {object} opts
 * @param {(event: object) => void} opts.onEvent   recibe eventos del servidor
 * @param {(status: string) => void} opts.onStatus 'connecting' | 'open' | 'reconnecting' | 'closed'
 * @param {(error: Event | Error) => void} opts.onError recibe errores del transporte
 */
export class ChatClient {
  constructor({ onEvent, onStatus, onError }) {
    this.onEvent = onEvent
    this.onStatus = onStatus
    this.onError = onError
    this.ws = null
    this.roomId = null
    this.reconnectAttempts = 0
    this.reconnectTimer = null
    this.manualClose = false
  }

  connect() {
    this.manualClose = false
    this._open()
  }

  join(reservationId) {
    this.roomId = reservationId
    this._send({ type: 'join', reservationId })
  }

  send(reservationId, content, clientMessageId = createClientMessageId()) {
    const sent = this._send({
      type: 'message:send',
      reservationId,
      content,
      clientMessageId,
    })
    return sent ? clientMessageId : null
  }

  leave(reservationId) {
    this._send({ type: 'leave', reservationId })
    if (this.roomId === reservationId) this.roomId = null
  }

  disconnect() {
    this.manualClose = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  _open() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    this.onStatus?.('connecting')
    let ws
    try {
      ws = new WebSocket(buildWsUrl())
    } catch (error) {
      this.onError?.(error)
      this.onStatus?.('closed')
      if (!this.manualClose) this._scheduleReconnect()
      return
    }
    this.ws = ws

    ws.onopen = () => {
      this.reconnectAttempts = 0
      this.onStatus?.('open')
      // Tras una reconexión, re-suscribirse a la sala activa.
      if (this.roomId) this._send({ type: 'join', reservationId: this.roomId })
    }

    ws.onmessage = (evt) => {
      let event
      try {
        event = JSON.parse(evt.data)
      } catch {
        return
      }
      this.onEvent?.(event)
    }

    ws.onerror = (error) => {
      this.onError?.(error)
      this.onStatus?.('closed')
    }

    ws.onclose = () => {
      if (this.ws === ws) this.ws = null
      this.onStatus?.('closed')
      if (!this.manualClose) this._scheduleReconnect()
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** this.reconnectAttempts, RECONNECT_MAX_MS)
    this.reconnectAttempts += 1
    this.onStatus?.('reconnecting')
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this._open()
    }, delay)
  }

  _send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
      return true
    }
    return false
  }
}
