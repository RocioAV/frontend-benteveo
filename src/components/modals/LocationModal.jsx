import { useEffect, useRef } from 'react'
import { useLocation } from '../../context/LocationContext'
import './LocationModal.css'

const errorCopy = {
  denied: {
    title: 'El permiso quedó rechazado',
    message: 'Podés habilitar la ubicación desde los permisos del navegador y volver a intentarlo.',
  },
  unavailable: {
    title: 'La ubicación no está disponible',
    message: 'El dispositivo no informó una ubicación disponible. Podés probar de nuevo o continuar con una zona de referencia.',
  },
  timeout: {
    title: 'La búsqueda tardó demasiado',
    message: 'No recibimos una respuesta a tiempo. Podés probar de nuevo o continuar con una zona de referencia.',
  },
}

function LocationModal({ open, onClose }) {
  const { status, requestLocation, useDemoLocation } = useLocation()
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    previousFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => modalRef.current?.focus(), 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocusRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const isRequesting = status === 'requesting'
  const isError = status === 'denied' || status === 'unavailable' || status === 'timeout'
  const isComplete = status === 'active' || status === 'demo'
  const copy = errorCopy[status]

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose?.()
  }

  return (
    <div className="location-modal-overlay" onClick={handleBackdropClick} role="presentation">
      <div
        ref={modalRef}
        className="location-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
        tabIndex="-1"
      >
        <button
          type="button"
          className="location-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <i className="fas fa-times" aria-hidden="true" />
        </button>

        <div className={`location-modal-icon${isError ? ' location-modal-icon--error' : ''}`} aria-hidden="true">
          <i className={`fas ${isRequesting ? 'fa-spinner fa-spin' : isError ? 'fa-location-crosshairs' : 'fa-location-dot'}`} />
        </div>

        <h2 id="location-modal-title" className="location-modal-title">
          {isComplete
            ? status === 'demo' ? 'Zona de referencia lista' : 'Ubicación activa'
            : isRequesting ? 'Buscando tu ubicación' : isError ? copy.title : 'Encontrá herramientas cerca tuyo'}
        </h2>

        <p className="location-modal-description">
          {isComplete
            ? status === 'demo'
              ? 'Vamos a usar una zona de referencia para ordenar resultados por cercanía sin pedir acceso a tu ubicación real.'
              : 'Ya podés consultar resultados ordenados por cercanía. La ubicación se mantiene sólo en esta sesión.'
            : isRequesting
              ? 'Aceptá el permiso del navegador para ordenar los productos alrededor de tu ubicación actual.'
              : isError
                ? copy.message
                : 'Usamos tu ubicación para ordenar los productos por cercanía y mostrarte qué queda dentro de 10 cuadras.'}
        </p>

        {!isComplete && (
          <div className="location-modal-privacy">
            <i className="fas fa-shield-halved" aria-hidden="true" />
            <span>No guardamos ni enviamos tus coordenadas. Sólo se usan para calcular la cercanía en esta sesión.</span>
          </div>
        )}

        {isError && (
          <p className="location-modal-error" role="alert">
            {copy.message}
          </p>
        )}

        <div className="location-modal-actions">
          {isComplete ? (
            <button type="button" className="location-modal-btn location-modal-btn--primary" onClick={onClose}>
              Continuar
            </button>
          ) : (
            <>
              <button
                type="button"
                className="location-modal-btn location-modal-btn--primary"
                onClick={requestLocation}
                disabled={isRequesting}
              >
                {isRequesting ? 'Buscando...' : isError ? 'Probar de nuevo' : 'Usar mi ubicación'}
              </button>
              <button
                type="button"
                className="location-modal-btn location-modal-btn--secondary"
                onClick={useDemoLocation}
                disabled={isRequesting}
              >
                Usar ubicación demo
              </button>
            </>
          )}
        </div>

        {!isComplete && isRequesting && (
          <p className="location-modal-status" role="status" aria-live="polite">
            Esperando una respuesta del navegador...
          </p>
        )}
      </div>
    </div>
  )
}

export default LocationModal
