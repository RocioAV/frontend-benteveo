import { useEffect, useRef, useState } from 'react'
import { motion, MotionConfig } from 'motion/react'
import { useAuth } from '../../context/useAuth'
import { ChatClient, fetchMessages } from '../../services/chat.service.js'
import styles from './ChatWindow.module.css'

// Springs (DESIGN.md §3 — gramática mecánico-líquida)
const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

const STATUS_LABELS = {
  connecting: 'Conectando…',
  reconnecting: 'Reconectando…',
  open: 'En línea',
  closed: 'Sin conexión',
}

const STATUS_CLASS = {
  connecting: styles.chatStatusConnecting,
  reconnecting: styles.chatStatusConnecting,
  open: styles.chatStatusOpen,
  closed: styles.chatStatusClosed,
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function initials(name) {
  if (!name) return '?'
  const letters = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
  return letters || '?'
}

// Reemplaza el mensaje optimista local (mismo contenido del mismo emisor) por el
// confirmado por el servidor. Si no hay pendiente, lo agrega al final.
function upsertMessage(messages, message) {
  const pendingIndex = messages.findIndex(
    (m) => m.pending && m.senderId === message.senderId && m.content === message.content,
  )
  if (pendingIndex !== -1) {
    const next = [...messages]
    next[pendingIndex] = message
    return next
  }
  return [...messages, message]
}

function ChatWindow({ reservationId, otherName, readOnly = false }) {
  const { userId } = useAuth()

  // El token de WebSocket aún no está definido: el subprotocolo que lo
  // transporta es una decisión de diseño pendiente (fuera de scope). Sin token
  // no se instancia ChatClient; se renderiza un placeholder en su lugar.
  const wsToken = null
  const hasWsToken = Boolean(wsToken)

  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('connecting')
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const clientRef = useRef(null)
  const listRef = useRef(null)

  // Historial (REST, best-effort) + conexión WebSocket en tiempo real.
  useEffect(() => {
    if (!hasWsToken) return

    let cancelled = false

    fetchMessages(reservationId).then((history) => {
      if (cancelled) return
      setMessages(Array.isArray(history) ? history : [])
      setHistoryLoaded(true)
    })

    const client = new ChatClient({
      token: wsToken,
      onEvent: (event) => {
        if (event.type === 'message:history') {
          setMessages(Array.isArray(event.messages) ? event.messages : [])
          setHistoryLoaded(true)
        } else if (event.type === 'message:new') {
          setMessages((prev) => upsertMessage(prev, event.message))
        }
      },
      onStatus: setStatus,
    })
    clientRef.current = client
    client.connect()
    client.join(reservationId)

    return () => {
      cancelled = true
      client.disconnect()
      clientRef.current = null
    }
  }, [reservationId, hasWsToken])

  // Auto-scroll al último mensaje.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content || !clientRef.current) return

    clientRef.current.send(reservationId, content)
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        senderId: userId,
        content,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ])
    setDraft('')
  }

  if (!hasWsToken) {
    return (
      <div className={styles.chat}>
        <p className={styles.chatHint}>Chat no disponible</p>
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.chat}>
        <header className={styles.chatHeader}>
          <div className={styles.chatHeaderInfo}>
            <span className={styles.chatAvatar} aria-hidden="true">
              {initials(otherName)}
            </span>
            <div>
              <p className={styles.chatName}>{otherName}</p>
              <p className={`${styles.chatStatus} ${STATUS_CLASS[status] || styles.chatStatusConnecting}`}>
                <span className={styles.chatStatusDot} aria-hidden="true" />
                {STATUS_LABELS[status] || 'Conectando…'}
              </p>
            </div>
          </div>
        </header>

        <div className={styles.chatBody} ref={listRef} role="log" aria-live="polite" aria-label="Mensajes">
          {!historyLoaded ? (
            <p className={styles.chatHint}>Cargando conversación…</p>
          ) : messages.length === 0 ? (
            <p className={styles.chatHint}>
              Todavía no hay mensajes. Escribí para coordinar la entrega.
            </p>
          ) : (
            messages.map((message) => {
              const isMine = message.senderId === userId
              return (
                <motion.div
                  key={message.id}
                  className={`${styles.bubbleRow} ${isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springReveal}
                >
                  <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                    <p className={styles.bubbleText}>{message.content}</p>
                    <span className={styles.bubbleTime}>{formatTime(message.createdAt)}</span>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {readOnly && (
          <p className={styles.chatHint}>Esta conversación está cerrada. Solo lectura.</p>
        )}
        <form className={styles.chatForm} onSubmit={handleSend}>
          <input
            className={styles.chatInput}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={readOnly ? 'Conversación cerrada' : 'Escribí un mensaje…'}
            aria-label="Mensaje"
            disabled={status === 'closed' || readOnly}
          />
          <motion.button
            type="submit"
            className={styles.chatSend}
            whileTap={{ scale: 0.96 }}
            transition={springLatch}
            disabled={!draft.trim() || status === 'closed' || readOnly}
            aria-label="Enviar mensaje"
          >
            <i className="fas fa-paper-plane" aria-hidden="true" />
          </motion.button>
        </form>
      </div>
    </MotionConfig>
  )
}

export default ChatWindow
