import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import { useAuth } from '../context/useAuth'
import ChatWindow from '../components/ChatWindow/ChatWindow.jsx'
import Skeleton from '../components/Skeleton/Skeleton.jsx'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import { fetchInquiry } from '../services/inquiries.service.js'
import './ChatPage.css'

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function InquiryChatPage() {
  const { inquiryId } = useParams()
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [loadState, setLoadState] = useState({ inquiryId: null, inquiry: null, error: false })

  useEffect(() => {
    let cancelled = false

    fetchInquiry(inquiryId)
      .then((data) => {
        if (!cancelled) setLoadState({ inquiryId, inquiry: data, error: false })
      })
      .catch(() => {
        if (!cancelled) setLoadState({ inquiryId, inquiry: null, error: true })
      })

    return () => {
      cancelled = true
    }
  }, [inquiryId])

  const isCurrentInquiry = loadState.inquiryId === inquiryId

  if (isCurrentInquiry && loadState.error) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="chatpage">
          <EmptyState
            message="No pudimos cargar la consulta. Puede que no tengas acceso a esta conversación."
            actionLabel="Volver a mis conversaciones"
            onAction={() => navigate('/dashboard?tab=conversaciones')}
          />
        </div>
      </MotionConfig>
    )
  }

  if (!isCurrentInquiry || loadState.inquiry === null) {
    return (
      <div className="chatpage">
        <Skeleton rows={6} />
      </div>
    )
  }

  const inquiry = loadState.inquiry
  const product = inquiry.product
  const isOwner = product?.ownerId === userId
  const otherName = isOwner
    ? inquiry.requester?.name || 'Inquilino'
    : product?.owner?.name || 'Propietario'
  const imageUrl = product?.imageUrl || product?.photos?.[0]?.url || null

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
            {imageUrl ? (
              <img className="chatpage-product-img" src={imageUrl} alt={product?.title || 'Producto'} />
            ) : (
              <div className="chatpage-product-placeholder">
                <i className="fas fa-toolbox" aria-hidden="true" />
              </div>
            )}
            <div className="chatpage-product-info">
              <p className="chatpage-label">Consulta pre-alquiler</p>
              <h1 className="chatpage-title">{product?.title || 'Producto'}</h1>
              <p className="chatpage-meta">
                Con {otherName} · iniciada {formatDate(inquiry.createdAt)}
              </p>
              <span className="chatpage-badge chatpage-badge--inquiry">Consulta</span>
            </div>
          </div>
        </motion.section>

        <motion.div
          className="chatpage-window"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springReveal, delay: 0.05 }}
        >
          <ChatWindow
            inquiryId={inquiryId}
            targetType="inquiry"
            otherName={otherName}
          />
        </motion.div>
      </div>
    </MotionConfig>
  )
}

export default InquiryChatPage
