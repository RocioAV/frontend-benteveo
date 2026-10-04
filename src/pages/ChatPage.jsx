import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import { useAuth } from '../context/useAuth'
import ChatWindow from '../components/ChatWindow/ChatWindow.jsx'
import Skeleton from '../components/Skeleton/Skeleton.jsx'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import { fetchReservation } from '../services/reservations.service.js'
import './ChatPage.css'

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  ACTIVE: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function ChatPage() {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const { userId } = useAuth()

  const [reservation, setReservation] = useState(null) // null = cargando
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchReservation(reservationId)
      .then((data) => {
        if (cancelled) return
        setReservation(data)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [reservationId])

  if (error) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="chatpage">
          <EmptyState
            message="No pudimos cargar la conversación. Puede que no tengas acceso a esta reserva."
            actionLabel="Volver a mis conversaciones"
            onAction={() => navigate('/dashboard?tab=conversaciones')}
          />
        </div>
      </MotionConfig>
    )
  }

  if (reservation === null) {
    return (
      <div className="chatpage">
        <Skeleton rows={6} />
      </div>
    )
  }

  const product = reservation.product
  const isOwner = product?.ownerId === userId
  const otherName = isOwner ? reservation.user?.name || 'Inquilino' : 'Propietario'
  const status = reservation.status
  const readOnly = status === 'CANCELLED' || status === 'COMPLETED'

  return (
    <MotionConfig reducedMotion="user">
      <div className="chatpage">
        <button type="button" className="chatpage-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
        </button>

        <motion.section
          className="chatpage-context"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springReveal}
        >
          <div className="chatpage-product">
            {product?.imageUrl ? (
              <img className="chatpage-product-img" src={product.imageUrl} alt={product.title} />
            ) : (
              <div className="chatpage-product-placeholder">
                <i className="fas fa-toolbox" aria-hidden="true" />
              </div>
            )}
            <div className="chatpage-product-info">
              <p className="chatpage-label">Producto</p>
              <h1 className="chatpage-title">{product?.title || 'Producto'}</h1>
              <p className="chatpage-meta">
                {formatDate(reservation.dateInit)} → {formatDate(reservation.dateEnd)} · con {otherName}
              </p>
              <span className={`chatpage-badge chatpage-badge--${status.toLowerCase()}`}>
                {STATUS_LABELS[status] || status}
              </span>
            </div>
          </div>
        </motion.section>

        {readOnly ? (
          <p className="chatpage-readonly" role="status">
            <i className="fas fa-lock" aria-hidden="true" /> Esta reserva está cerrada. La conversación es de solo lectura.
          </p>
        ) : null}

        <motion.div
          className="chatpage-window"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springReveal, delay: 0.05 }}
        >
          <ChatWindow reservationId={reservationId} otherName={otherName} readOnly={readOnly} />
        </motion.div>
      </div>
    </MotionConfig>
  )
}

export default ChatPage
