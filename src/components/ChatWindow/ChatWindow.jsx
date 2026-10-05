import { useEffect, useRef, useState } from 'react'
import { motion, MotionConfig } from 'motion/react'
import { useAuth } from '../../context/useAuth'
import { ChatClient, createClientMessageId, fetchMessages } from '../../services/chat.service.js'
import { fetchInquiryMessages } from '../../services/inquiries.service.js'
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

// Reconciles the sender's optimistic message and deduplicates the server
// broadcast received by every participant in the room.
function upsertMessage(messages, message, clientMessageId) {
  if (!message || typeof message !== 'object') return messages

  const pendingIndex = clientMessageId
    ? messages.findIndex((item) => item.clientMessageId === clientMessageId)
    : -1
  const serverIndex = message.id
    ? messages.findIndex((item) => item.id === message.id)
    : -1
  const existingIndex = pendingIndex !== -1 ? pendingIndex : serverIndex
  const confirmedMessage = { ...message, pending: false }

  if (existingIndex !== -1) {
    const next = [...messages]
    next[existingIndex] = confirmedMessage
    return next
  }

  return [...messages, confirmedMessage]
}

function mergeHistory(messages, history) {
  const next = history.reduce((current, message) => upsertMessage(current, message), [])

  messages.forEach((message) => {
    const alreadyIncluded = next.some(
      (item) =>
        item.id === message.id ||
        (message.clientMessageId && item.clientMessageId === message.clientMessageId),
    )
    if (!alreadyIncluded) next.push(message)
  })

  return next
}

function ChatWindow({
  reservationId,
  inquiryId,
  targetType = 'reservation',
  otherName,
  readOnly = false,
}) {
  const { userId } = useAuth()
  const isInquiry = targetType === 'inquiry'
  const targetId = isInquiry ? inquiryId : reservationId

  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('connecting')
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [chatError, setChatError] = useState('')
  const clientRef = useRef(null)
  const listRef = useRef(null)

  // REST history (best-effort) plus the native WebSocket connection.
  useEffect(() => {
    let cancelled = false

    const historyPromise = isInquiry
      ? fetchInquiryMessages(targetId)
      : fetchMessages(targetId)

    historyPromise.then((history) => {
      if (cancelled) return
      setMessages((current) => mergeHistory(current, Array.isArray(history) ? history : []))
      setHistoryLoaded(true)
    })

    const client = new ChatClient({
      targetType,
      onEvent: (event) => {
        if (event.type === (isInquiry ? 'inquiry:history' : 'message:history')) {
          setMessages(Array.isArray(event.messages) ? event.messages : [])
          setHistoryLoaded(true)
        } else if (event.type === (isInquiry ? 'inquiry:message:new' : 'message:new')) {
          setMessages((prev) => upsertMessage(prev, event.message, event.clientMessageId))
        } else if (event.type === 'error') {
          if (event.clientMessageId) {
            setMessages((prev) =>
              prev.filter((message) => message.clientMessageId !== event.clientMessageId),
            )
          }
          setChatError(event.message || 'No pudimos procesar el mensaje.')
        }
      },
      onStatus: (nextStatus) => {
        setStatus(nextStatus)
        if (nextStatus === 'open') setChatError('')
      },
      onError: () => setChatError('Se perdió la conexión. Intentando reconectar…'),
    })
    clientRef.current = client
    client.connect()
    client.join(targetId)

    return () => {
      cancelled = true
      client.disconnect()
      clientRef.current = null
    }
  }, [targetId, targetType, isInquiry])

  // Auto-scroll al último mensaje.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content || !clientRef.current || status !== 'open' || readOnly) return

    const clientMessageId = createClientMessageId()
    const sent = clientRef.current.send(targetId, content, clientMessageId)
    if (!sent) return

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${clientMessageId}`,
        senderId: userId,
        content,
        createdAt: new Date().toISOString(),
        pending: true,
        clientMessageId,
      },
    ])
    setDraft('')
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

        {chatError && (
          <p className={styles.chatError} role="alert">
            {chatError}
          </p>
        )}

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
            disabled={status !== 'open' || readOnly}
          />
          <motion.button
            type="submit"
            className={styles.chatSend}
            whileTap={{ scale: 0.96 }}
            transition={springLatch}
            disabled={!draft.trim() || status !== 'open' || readOnly}
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
