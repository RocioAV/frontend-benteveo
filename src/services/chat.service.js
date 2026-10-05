// Native WebSocket chat client plus REST history.
// The session is authenticated with the browser cookie during the handshake.

import apiClient from './api'

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 10000

// Derive the WebSocket URL from the REST API URL (same host, different scheme).
// Use VITE_WS_URL when the gateway lives on another host.
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

// Reservation history (REST fallback for the initial load).
// If the endpoint is unavailable, keep the existing empty-history behavior.
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
 * Chat client with exponential reconnect and automatic re-join.
 *
 * @param {object} opts
 * @param {(event: object) => void} opts.onEvent   recibe eventos del servidor
 * @param {(status: string) => void} opts.onStatus 'connecting' | 'open' | 'reconnecting' | 'closed'
 * @param {(error: Event | Error) => void} opts.onError recibe errores del transporte
 */
export class ChatClient {
  constructor({ onEvent, onStatus, onError, targetType = 'reservation' }) {
    this.onEvent = onEvent
    this.onStatus = onStatus
    this.onError = onError
    this.targetType = targetType === 'inquiry' ? 'inquiry' : 'reservation'
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
    this._send(this._targetPayload('join', reservationId))
  }

  send(reservationId, content, clientMessageId = createClientMessageId()) {
    const sent = this._send(
      this._targetPayload('message:send', reservationId, { content, clientMessageId }),
    )
    return sent ? clientMessageId : null
  }

  leave(reservationId) {
    this._send(this._targetPayload('leave', reservationId))
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
      // Re-subscribe to the active room after reconnecting.
      if (this.roomId) this._send(this._targetPayload('join', this.roomId))
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

  _targetPayload(action, id, extra = {}) {
    if (this.targetType === 'inquiry') {
      const type = action === 'join'
        ? 'inquiry:join'
        : action === 'leave'
          ? 'inquiry:leave'
          : 'inquiry:message:send'
      return { type, inquiryId: id, ...extra }
    }

    const type = action === 'join' ? 'join' : action === 'leave' ? 'leave' : 'message:send'
    return { type, reservationId: id, ...extra }
  }
}
