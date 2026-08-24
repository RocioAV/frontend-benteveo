import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'
import './ReceiveObjectModal.css'

const springModal = { type: 'spring', stiffness: 400, damping: 28 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

function ReceiveObjectModal({ isOpen, onClose, onConfirm, objectName = '', action = 'received' }) {
  const [loading, setLoading] = useState(false)
  const overlayRef = useRef(null)
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  const isReceived = action === 'received'

  const title = isReceived ? '¿Recibiste el objeto?' : '¿Devolviste el objeto?'
  const description = isReceived
    ? 'Confirmá que recibiste correctamente el objeto para finalizar el alquiler.'
    : 'Confirmá que devolviste correctamente el objeto para cerrar el alquiler.'
  const confirmLabel = isReceived ? 'Marcar como recibido' : 'Marcar como devuelto'

  const handleConfirm = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      await onConfirm?.()
    } finally {
      setLoading(false)
    }
  }, [loading, onConfirm])

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
            className="bv-modal-overlay"
            onClick={handleOverlayClick}
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              ref={modalRef}
              className="bv-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="receive-modal-title"
              tabIndex="-1"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={springModal}
            >
              <button
                className="bv-modal__close"
                onClick={onClose}
                aria-label="Cerrar"
                type="button"
              >
                <i className="fas fa-times"></i>
              </button>

              <div className="bv-modal__icon">
                <i className={`fas ${isReceived ? 'fa-box-open' : 'fa-hand-holding-arrow-right'}`}></i>
              </div>

              <h2 id="receive-modal-title" className="bv-modal__title">
                {title}
              </h2>

              {objectName && (
                <p className="bv-modal__object">{objectName}</p>
              )}

              <p className="bv-modal__description">{description}</p>

              <div className="bv-modal__actions">
                <button
                  className="bv-modal__btn bv-modal__btn--secondary"
                  onClick={onClose}
                  type="button"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <motion.button
                  className="bv-modal__btn bv-modal__btn--primary"
                  onClick={handleConfirm}
                  type="button"
                  disabled={loading}
                  whileTap={{ scale: 0.96 }}
                  transition={springLatch}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                      Procesando...
                    </>
                  ) : (
                    confirmLabel
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

export default ReceiveObjectModal
