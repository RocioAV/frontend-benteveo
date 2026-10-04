import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'
import { toast } from 'react-toastify'
import { createReservation } from '../../services/reservations.service.js'
import { createPaymentPreference } from '../../services/payments.service.js'
import './PaymentModal.css'

const springModal = { type: 'spring', stiffness: 400, damping: 28 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

function PaymentModal({ isOpen, onClose, reservation }) {
  const [loading, setLoading] = useState(false)
  const overlayRef = useRef(null)
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  const titulo = reservation?.titulo || ''
  const precio = reservation?.precio || 0
  const deposit = reservation?.deposit || 0
  const dias = reservation?.dias || 0
  const subtotal = precio * dias
  const total = subtotal + deposit

  const handlePay = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const created = await createReservation({
        productId: reservation.productId,
        dateInit: reservation.dateInit,
        dateEnd: reservation.dateEnd,
      })

      const paymentId = created?.payment?.id ?? ''
      const { init_point } = await createPaymentPreference(paymentId)
      window.location.href = init_point
    } catch (err) {
      if (err.status === 401) {
        toast.error('Iniciá sesión para reservar')
      } else {
        toast.error(err.message || 'No pudimos procesar tu reserva')
      }
      setLoading(false)
    }
  }, [loading, reservation])

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) {
      onClose?.()
    }
  }, [onClose])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose?.()
    }
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined

    previousFocusRef.current = document.activeElement
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => modalRef.current?.focus(), 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [isOpen, handleKeyDown])

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={overlayRef}
            className="payment-modal-overlay"
            onClick={handleOverlayClick}
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              ref={modalRef}
              className="payment-modal-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-modal-title"
              tabIndex="-1"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={springModal}
            >
              <button
                className="payment-modal-close"
                onClick={onClose}
                aria-label="Cerrar"
                type="button"
              >
                <i className="fas fa-times"></i>
              </button>

              <div className="payment-modal-icon">
                <i className="fas fa-lock"></i>
              </div>

              <h2 id="payment-modal-title" className="payment-modal-title">
                Resumen de tu reserva
              </h2>

              <p className="payment-modal-desc">
                Revisá los detalles antes de continuar con el pago
              </p>

              <div className="payment-summary">
                <div className="payment-summary__row">
                  <span>Producto</span>
                  <strong>{titulo}</strong>
                </div>
                <div className="payment-summary__row">
                  <span>Precio por día</span>
                  <span>${precio.toLocaleString('es-AR')}</span>
                </div>
                <div className="payment-summary__row">
                  <span>Cantidad de días</span>
                  <span>{dias}</span>
                </div>
                <div className="payment-summary__divider"></div>
                <div className="payment-summary__row">
                  <span>Alquiler</span>
                  <span>${subtotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="payment-summary__row">
                  <span>
                    Depósito en garantía
                    <span className="payment-summary__badge"> (Reembolsable)</span>
                  </span>
                  <span>${deposit.toLocaleString('es-AR')}</span>
                </div>
                <div className="payment-summary__divider"></div>
                <div className="payment-summary__row payment-summary__row--total">
                  <span>Total</span>
                  <strong>${total.toLocaleString('es-AR')}</strong>
                </div>
              </div>

              <div className="payment-modal-actions">
                <button
                  className="payment-modal-btn payment-modal-btn--cancel"
                  onClick={onClose}
                  type="button"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <motion.button
                  className="payment-modal-btn payment-modal-btn--mp"
                  onClick={handlePay}
                  type="button"
                  disabled={loading}
                  whileTap={{ scale: 0.96 }}
                  transition={springLatch}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="fab fa-mercadopago"></i>
                      Pagar con Mercado Pago
                    </>
                  )}
                </motion.button>
              </div>

              <p className="payment-modal-secure">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="payment-modal-lock-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Pago 100% seguro. Tus datos estan protegidos.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

export default PaymentModal
