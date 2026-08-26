// Adapter de chat por reserva — WebSocket nativo + historial REST.
//
// Contrato (ver docs/PLAN-MEJORAS-UX-UI.md §Chat):
// - Conexión: ws(s)://<host>/chat, token JWT por SUBPROTOCOLO (['benteveo', token]).
//   El token NO viaja por query ni por header (el WS nativo no permite headers).
// - Sala = reservationId (1 conversación = 1 reserva).
// - Cliente → servidor: { type: 'join', reservationId }
//                       { type: 'message:send', reservationId, content }
//                       { type: 'leave', reservationId }
// - Servidor → cliente: { type: 'message:history', reservationId, messages }
//                       { type: 'message:new', message }
//                       { type: 'error', code, message }

import apiClient from './api'

const SUBPROTOCOL = 'benteveo'
const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 10000

// Deriva la URL del WebSocket desde la URL del API REST (mismo host, otro esquema).
// Override explícito con VITE_WS_URL cuando el gateway vive en otro host.
function buildWsUrl() {
  const explicit = import.meta.env.VITE_WS_URL
  if (explicit) return explicit

  const api = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  try {
    const url = new URL(api)
    const proto = url.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${url.host}/chat`
  } catch {
    return 'ws://localhost:3000/chat'
  }
}

// Historial de mensajes de una reserva (REST, fallback de la carga inicial).
// Forward-compatible: si el endpoint aún no existe en el backend, devuelve [].
export async function fetchMessages(reservationId) {
  try {
    return await apiClient(`/reservations/${reservationId}/messages`)
  } catch {
    return []
  }
}

/**
 * Cliente de chat por reserva con reconexión exponencial y re-join automático.
 *
 * @param {object} opts
 * @param {string} opts.token        JWT del usuario autenticado
 * @param {(event: object) => void} opts.onEvent   recibe eventos del servidor
 * @param {(status: string) => void} opts.onStatus 'connecting' | 'open' | 'reconnecting' | 'closed'
 */
export class ChatClient {
  constructor({ token, onEvent, onStatus }) {
    this.token = token
    this.onEvent = onEvent
    this.onStatus = onStatus
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

  send(reservationId, content) {
    this._send({ type: 'message:send', reservationId, content })
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
    const ws = new WebSocket(buildWsUrl(), [SUBPROTOCOL, this.token])
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

    ws.onclose = () => {
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
    }
  }
}
