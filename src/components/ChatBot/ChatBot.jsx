import { Fragment, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchProduct } from '../../services/products.service'
import { buildHistory, pageLabel, streamChat } from '../../services/gemini'
import { parseChatMarkdown } from '../../utils/chat-markdown'
import './ChatBot.css'

const STORAGE_KEY = 'benti-chat-messages'
const MAX_STORED = 40
const MENSAJE_ERROR =
  'No pude conectar con Benti IA en este momento. Probá de nuevo en unos segundos.'
const SALUDO = {
  id: 1,
  texto: 'Hola! Soy Benti, tu asistente virtual. Como te puedo ayudar?',
  esBot: true,
}

function loadStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return parsed.filter(
      (m) => m && typeof m.texto === 'string' && typeof m.esBot === 'boolean' && typeof m.id === 'number',
    )
  } catch {
    return null
  }
}

function persistir(mensajes) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mensajes.slice(-MAX_STORED)))
    return true
  } catch {
    return false
  }
}

function renderInline(nodos, keyPrefix) {
  return nodos.map((nodo, i) => {
    if (nodo.type === 'bold') return <strong key={`${keyPrefix}-b${i}`}>{nodo.value}</strong>
    if (nodo.type === 'code') return <code key={`${keyPrefix}-c${i}`}>{nodo.value}</code>
    return nodo.value
  })
}

function renderTexto(texto, keyPrefix) {
  return parseChatMarkdown(texto).map((bloque, i) => {
    const key = `${keyPrefix}-${i}`
    if (bloque.type === 'list') {
      return (
        <ul key={key}>
          {bloque.items.map((item, j) => (
            <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
          ))}
        </ul>
      )
    }
    return (
      <p key={key}>
        {bloque.lines.map((linea, j) => (
          <Fragment key={`${key}-${j}`}>
            {j > 0 && <br />}
            {renderInline(linea, `${key}-${j}`)}
          </Fragment>
        ))}
      </p>
    )
  })
}

const ChatBot = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [mensajes, setMensajes] = useState(() => loadStored() ?? [SALUDO])
  const [input, setInput] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [producto, setProducto] = useState(null)
  const mensajesRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight
    }
  }, [mensajes])

  useEffect(() => {
    persistir(mensajes)
  }, [mensajes])

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    const match = location.pathname.match(/^\/detalle\/([^/]+)$/)
    if (!match) return undefined
    let cancelado = false
    fetchProduct(match[1])
      .then((p) => {
        if (cancelado) return
        const precio = Number(p.pricePerDay)
        setProducto({
          id: match[1],
          title: p.title,
          ...(Number.isFinite(precio) && precio > 0 ? { pricePerDay: precio } : {}),
        })
      })
      .catch(() => undefined)
    return () => {
      cancelado = true
    }
  }, [location.pathname])

  const handleSend = async () => {
    const texto = input.trim()
    if (!texto || escribiendo) return

    const userMsg = { id: Date.now(), texto, esBot: false }
    const historial = buildHistory(mensajes)
    setMensajes((prev) => [...prev, userMsg])
    setInput('')
    setEscribiendo(true)

    const controller = new AbortController()
    abortRef.current = controller

    const match = location.pathname.match(/^\/detalle\/([^/]+)$/)
    const productoActual =
      producto && match && producto.id === match[1] ? producto : null
    const context = {
      page: pageLabel(location.pathname),
      ...(productoActual
        ? { product: { title: productoActual.title, ...(productoActual.pricePerDay !== undefined ? { pricePerDay: productoActual.pricePerDay } : {}) } }
        : {}),
    }

    const botId = Date.now() + 1
    let llegoAlgo = false

    const respuesta = await streamChat({
      message: texto,
      history: historial,
      context,
      signal: controller.signal,
      onDelta: (delta) => {
        if (!llegoAlgo) {
          llegoAlgo = true
          setMensajes((prev) => [...prev, { id: botId, texto: delta, esBot: true }])
        } else {
          setMensajes((prev) =>
            prev.map((m) => (m.id === botId ? { ...m, texto: m.texto + delta } : m)),
          )
        }
      },
    })

    if (respuesta) {
      setMensajes((prev) => {
        const existe = prev.some((m) => m.id === botId)
        if (existe) {
          return prev.map((m) => (m.id === botId ? { ...m, texto: respuesta } : m))
        }
        return [...prev, { id: botId, texto: respuesta, esBot: true }]
      })
    } else {
      setMensajes((prev) => [...prev, { id: botId, texto: MENSAJE_ERROR, esBot: true, error: true }])
    }

    setEscribiendo(false)
    abortRef.current = null
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      handleSend()
    }
  }

  return (
    <div className="chatbot-container">
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div
          className="chatbot-window"
          role="dialog"
          aria-modal="true"
          aria-label="Asistente virtual Benti"
        >
          <div className="chatbot-header">
            <div className="chatbot-avatar">B</div>
            <div className="chatbot-info">
              <h3>Benti IA</h3>
              <span className="status-online">En linea</span>
            </div>
          </div>

          <div className="chatbot-mensajes" ref={mensajesRef} aria-live="polite">
            {mensajes.map((msg) => (
              <div key={msg.id} className={`mensaje ${msg.esBot ? 'bot' : 'usuario'}`}>
                {msg.esBot && <div className="avatar-bot">B</div>}
                <div className={`burbuja ${msg.error ? 'error' : ''}`}>
                  {msg.esBot && !msg.error
                    ? renderTexto(msg.texto, `m${msg.id}`)
                    : msg.texto}
                </div>
              </div>
            ))}

            {escribiendo && (
              <div className="mensaje bot">
                <div className="avatar-bot">B</div>
                <div className="burbuja escribiendo">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          <div className="chatbot-input">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribi tu pregunta..."
              aria-label="Mensaje para Benti"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || escribiendo}
              aria-label="Enviar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          <div className="chatbot-sugerencias">
            <button onClick={() => setInput('Como alquilo?')}>
              Alquilar
            </button>
            <button onClick={() => setInput('Como publico?')}>
              Publicar
            </button>
            <button onClick={() => setInput('Garantias')}>
              Garantias
            </button>
            <button onClick={() => setInput('Contacto')}>
              Soporte
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatBot
