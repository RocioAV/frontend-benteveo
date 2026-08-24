import { useState, useEffect, useRef, useCallback } from 'react'
import './ReceiveObjectModal.css'

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
    if (isOpen) {
      previousFocusRef.current = document.activeElement
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      setTimeout(() => modalRef.current?.focus(), 50)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [isOpen, handleKeyDown])

  return (
    <div
      ref={overlayRef}
      className={`bv-modal-overlay ${isOpen ? 'bv-modal-overlay--open' : ''}`}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="bv-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receive-modal-title"
        tabIndex="-1"
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
          <button
            className="bv-modal__btn bv-modal__btn--primary"
            onClick={handleConfirm}
            type="button"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                Procesando...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReceiveObjectModal
