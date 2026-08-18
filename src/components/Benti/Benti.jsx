import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'
import products from '../../data/products.json'
import { normalizeText } from '../../utils/products.js'
import soloLogo from '../../assets/solo-logo-app.webp'
import styles from './Benti.module.css'

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }

// Cerebro local de Benti: buscador conversacional sobre el catálogo.
function bentiReply(raw) {
  const q = normalizeText(raw).trim()
  if (!q) return null

  const greetings = ['hola', 'buenas', 'hey', 'que tal', 'como estas', 'como andas', 'ayuda', 'help', 'que podes hacer']
  if (greetings.some((g) => q.includes(g))) {
    return {
      type: 'text',
      text: '¡Hola! Soy Benti. Preguntame por algo que quieras alquilar — por ejemplo "taladro", "carpa" o "herramientas" — y te muestro lo que hay cerca tuyo.',
    }
  }

  const words = q.split(' ').filter((w) => w.length > 2)
  const matches = products
    .filter((p) => {
      const hay = normalizeText(`${p.title} ${p.category}`)
      return words.some((w) => hay.includes(w))
    })
    .slice(0, 3)

  if (matches.length === 0) {
    return {
      type: 'text',
      text: 'Mmm, no encontré nada con eso. Probá con otra palabra, por ejemplo "electrodomésticos", "jardinería" o "muebles".',
    }
  }

  return {
    type: 'products',
    text: matches.length === 1 ? 'Encontré esto para vos:' : `Encontré ${matches.length} opciones para vos:`,
    items: matches,
  }
}

function Benti() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      from: 'benti',
      text: '¡Hola! Soy Benti, tu asistente. Preguntame qué querés alquilar y te ayudo a encontrarlo.',
    },
  ])
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  const send = (e) => {
    e.preventDefault()
    const value = input.trim()
    if (!value) return
    const reply = bentiReply(value)
    setMessages((prev) => [...prev, { from: 'user', text: value }])
    if (reply) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { from: 'benti', ...reply }])
      }, 350)
    }
    setInput('')
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.root}>
        <AnimatePresence>
          {open && (
            <motion.div
              className={styles.panel}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={springReveal}
              role="dialog"
              aria-label="Asistente Benti"
            >
              <div className={styles.header}>
                <span className={styles.headerBird}>
                  <img src={soloLogo} className={styles.bird} alt="" />
                </span>
                <div className={styles.headerText}>
                  <strong>Benti</strong>
                  <span>Tu asistente del barrio</span>
                </div>
                <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Cerrar asistente">
                  <i className="fas fa-xmark" aria-hidden="true" />
                </button>
              </div>

              <div className={styles.messages} ref={listRef}>
                {messages.map((m, i) => (
                  <div key={i} className={m.from === 'user' ? `${styles.msg} ${styles.msgUser}` : styles.msg}>
                    {m.from === 'user' ? (
                      <div className={styles.bubbleUser}>{m.text}</div>
                    ) : (
                      <div className={styles.bubble}>
                        <p>{m.text}</p>
                        {m.type === 'products' && m.items && (
                          <div className={styles.suggestions}>
                            {m.items.map((p) => (
                              <Link key={p.id} to={`/detalle/${p.id}`} className={styles.suggestion} onClick={() => setOpen(false)}>
                                <img src={p.imageUrl} alt={p.title} loading="lazy" />
                                <span className={styles.suggestionBody}>
                                  <strong>{p.title}</strong>
                                  <small>${p.pricePerDay.toLocaleString('es-AR')}/día · {p.city}</small>
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form className={styles.inputRow} onSubmit={send}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Preguntale a Benti…"
                  aria-label="Escribí tu consulta"
                />
                <button type="submit" aria-label="Enviar">
                  <i className="fas fa-paper-plane" aria-hidden="true" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          className={styles.fab}
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          aria-label={open ? 'Cerrar asistente Benti' : 'Abrir asistente Benti'}
          aria-expanded={open}
        >
          {open ? (
            <i className="fas fa-xmark" aria-hidden="true" />
          ) : (
            <img src={soloLogo} className={styles.fabBird} alt="" />
          )}
        </motion.button>
      </div>
    </MotionConfig>
  )
}

export default Benti
