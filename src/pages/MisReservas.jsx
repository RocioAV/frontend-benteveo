import { useEffect, useState } from 'react'
import { motion, MotionConfig, AnimatePresence } from 'motion/react'
import Skeleton from '../components/Skeleton/Skeleton.jsx'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import ChatWindow from '../components/ChatWindow/ChatWindow.jsx'
import { fetchMyReservations, fetchReservationsAsOwner } from '../services/reservations.service.js'
import './MisReservas.css'

// Springs (DESIGN.md §3 — gramática mecánico-líquida)
const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  ACTIVE: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

const TABS = [
  { id: 'renter', label: 'Como inquilino' },
  { id: 'owner', label: 'Como dueño' },
]

const MS_PER_DAY = 1000 * 60 * 60 * 24

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

function rentalDays(reservation) {
  const start = new Date(reservation.dateInit)
  const end = new Date(reservation.dateEnd)
  const days = Math.round((end - start) / MS_PER_DAY) + 1
  return Number.isFinite(days) && days > 0 ? days : 1
}

// La otra parte de la conversación según el punto de vista.
function otherParty(reservation, tab) {
  if (tab === 'owner') return reservation.user?.name || 'Inquilino'
  return 'Propietario'
}

function MisReservas() {
  const [tab, setTab] = useState('renter')
  const [reservations, setReservations] = useState(null) // null = cargando
  const [error, setError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [activeChat, setActiveChat] = useState(null)

  const handleTabChange = (id) => {
    if (id === tab) return
    setTab(id)
    setReservations(null)
    setError(false)
  }

  const handleRetry = () => {
    setReservations(null)
    setError(false)
    setReloadToken((t) => t + 1)
  }

  useEffect(() => {
    let cancelled = false

    const fetchFn = tab === 'renter' ? fetchMyReservations : fetchReservationsAsOwner
    fetchFn()
      .then((data) => {
        if (cancelled) return
        setReservations(data)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [tab, reloadToken])

  return (
    <MotionConfig reducedMotion="user">
      <section className="misreservas" aria-labelledby="misreservas-titulo">
        <header className="misreservas__encabezado">
          <h1 id="misreservas-titulo" className="misreservas__titulo">
            Mis reservas
          </h1>
          <p className="misreservas__descripcion">
            Coordiná las entregas y hablá con la otra parte.
          </p>
        </header>

        <div className="misreservas__tabs" role="tablist" aria-label="Tipo de reserva">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'misreservas__tab misreservas__tab--active' : 'misreservas__tab'}
              onClick={() => handleTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? (
          <EmptyState
            message="No pudimos cargar tus reservas. Probá de nuevo en unos segundos."
            actionLabel="Reintentar"
            onAction={handleRetry}
          />
        ) : reservations === null ? (
          <Skeleton rows={5} />
        ) : reservations.length === 0 ? (
          <EmptyState
            message={
              tab === 'renter'
                ? 'Todavía no alquilaste nada. Explorá el catálogo para empezar.'
                : 'Todavía no tenés reservas en tus productos.'
            }
          />
        ) : (
          <div className="misreservas__lista">
            {reservations.map((reservation, i) => {
              const product = reservation.product
              const status = reservation.status
              const other = otherParty(reservation, tab)
              const days = rentalDays(reservation)

              return (
                <motion.article
                  key={reservation.id}
                  className="misreservas__card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springReveal, delay: Math.min(i * 0.04, 0.2) }}
                >
                  <div className="misreservas__media">
                    {product?.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} loading="lazy" decoding="async" />
                    ) : (
                      <div className="misreservas__mediaPlaceholder">
                        <i className="fas fa-toolbox" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="misreservas__body">
                    <div className="misreservas__top">
                      <h2 className="misreservas__nombre">{product?.title || 'Producto'}</h2>
                      <span className={`misreservas__badge misreservas__badge--${status.toLowerCase()}`}>
                        {STATUS_LABELS[status] || status}
                      </span>
                    </div>

                    <p className="misreservas__meta">
                      {formatDate(reservation.dateInit)} → {formatDate(reservation.dateEnd)} ·{' '}
                      {days} {days === 1 ? 'día' : 'días'}
                    </p>

                    <p className="misreservas__otro">con {other}</p>

                    <div className="misreservas__footer">
                      <span className="misreservas__precio">
                        ${(product?.pricePerDay ?? 0).toLocaleString('es-AR')}
                        <span className="misreservas__precioUnidad">/día</span>
                      </span>
                      <motion.button
                        type="button"
                        className="misreservas__chatBtn"
                        whileTap={{ scale: 0.96 }}
                        transition={springLatch}
                        onClick={() => setActiveChat({ id: reservation.id, otherName: other })}
                      >
                        <i className="fas fa-comment" aria-hidden="true" /> Chatear
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {activeChat && (
          <div
            className="misreservas__modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Chat con ${activeChat.otherName}`}
          >
            <motion.div
              className="misreservas__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveChat(null)}
            />
            <motion.div
              className="misreservas__panel"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={springReveal}
            >
              <button
                type="button"
                className="misreservas__cerrar"
                onClick={() => setActiveChat(null)}
                aria-label="Cerrar chat"
              >
                <i className="fas fa-xmark" aria-hidden="true" />
              </button>
              <ChatWindow reservationId={activeChat.id} otherName={activeChat.otherName} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

export default MisReservas
