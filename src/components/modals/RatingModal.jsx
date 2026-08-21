import { useState, useEffect, useRef, useCallback } from 'react'
import './ReceiveObjectModal.css'
import './RatingModal.css'

const MAX_COMMENT_LENGTH = 300

const RATING_LABELS = [
  '',
  'Muy mala',
  'Mala',
  'Regular',
  'Buena',
  'Excelente'
]

const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

function RatingModal({ isOpen, onClose, onSubmit, objectName = '' }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const overlayRef = useRef(null)
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  const displayRating = hoverRating || rating

  const handleSubmit = useCallback(async () => {
    if (!rating || loading) return
    setLoading(true)
    try {
      await onSubmit?.({ rating, comment: comment.trim() })
    } finally {
      setLoading(false)
    }
  }, [rating, comment, loading, onSubmit])

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

  // Reset form state when modal closes (deferred to avoid cascading renders)
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setRating(0)
        setHoverRating(0)
        setComment('')
        setLoading(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

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
        aria-labelledby="rating-modal-title"
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

        <div className="bv-modal__icon" style={{
          background: 'linear-gradient(135deg, #fff8e1, #ffecb3)',
          color: '#f59e0b'
        }}>
          <i className="fas fa-star"></i>
        </div>

        <h2 id="rating-modal-title" className="bv-modal__title">
          ¿Cómo fue tu experiencia?
        </h2>

        {objectName && (
          <p className="bv-modal__object">{objectName}</p>
        )}

        <p className="bv-modal__description">
          Contanos cómo fue tu experiencia con el alquiler.
        </p>

        {/* Stars */}
        <div className="bv-rating-modal__stars" role="radiogroup" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              className={`bv-rating-modal__star ${
                value <= displayRating
                  ? 'bv-rating-modal__star--filled'
                  : 'bv-rating-modal__star--empty'
              }`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} de 5 estrellas — ${RATING_LABELS[value]}`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d={STAR_PATH} />
              </svg>
            </button>
          ))}
        </div>

        {/* Labels */}
        <div className="bv-rating-modal__labels">
          <span className="bv-rating-modal__label">Muy mala</span>
          <span className="bv-rating-modal__label">Excelente</span>
        </div>

        {/* Selected rating text */}
        <p className="bv-rating-modal__selected">
          {displayRating > 0 ? RATING_LABELS[displayRating] : '\u00A0'}
        </p>

        {/* Comment textarea */}
        <label className="bv-rating-modal__comment-label" htmlFor="rating-comment">
          Comentario (opcional)
        </label>
        <textarea
          id="rating-comment"
          className="bv-rating-modal__textarea"
          placeholder="Escribí tu comentario..."
          value={comment}
          onChange={(e) => {
            if (e.target.value.length <= MAX_COMMENT_LENGTH) {
              setComment(e.target.value)
            }
          }}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
        />
        <p className={`bv-rating-modal__char-count ${
          comment.length >= MAX_COMMENT_LENGTH ? 'bv-rating-modal__char-count--warn' : ''
        }`}>
          {comment.length}/{MAX_COMMENT_LENGTH}
        </p>

        {/* Footer buttons */}
        <div className="bv-rating-modal__footer">
          <button
            className="bv-modal__btn bv-modal__btn--secondary"
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            Ahora no
          </button>
          <button
            className="bv-modal__btn bv-modal__btn--primary"
            onClick={handleSubmit}
            type="button"
            disabled={!rating || loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                Enviando...
              </>
            ) : (
              'Enviar calificación'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RatingModal
