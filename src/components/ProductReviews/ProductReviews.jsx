import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/useAuth'
import Skeleton from '../Skeleton/Skeleton.jsx'
import {
  createComment,
  deleteComment,
  fetchComments,
  fetchMyRating,
  submitRating,
} from '../../services/reviews.service'

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

const MAX_COMMENT_LENGTH = 500

const RATING_LABELS = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente']

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function Stars({ value, size = 'w-4 h-4' }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`${size} ${i < value ? 'text-[var(--color-amber-400)]' : 'text-[var(--color-border)]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  )
}

function ProductReviews({ product, onRated }) {
  const { status, user, userId } = useAuth()
  const navigate = useNavigate()
  const authed = status === 'authed'
  const isOwner = user?.id != null && product.ownerId === user.id

  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [myScore, setMyScore] = useState(null)
  const [hoverScore, setHoverScore] = useState(0)
  const [text, setText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [prevProductId, setPrevProductId] = useState(product.id)
  const [prevAuthed, setPrevAuthed] = useState(authed)

  if (prevProductId !== product.id) {
    setPrevProductId(product.id)
    setComments([])
    setLoadingComments(true)
    setMyScore(null)
    setHoverScore(0)
    setText('')
  }

  if (prevAuthed !== authed) {
    setPrevAuthed(authed)
    setMyScore(null)
  }

  useEffect(() => {
    let cancelled = false

    fetchComments(product.id)
      .then((list) => {
        if (!cancelled) setComments(list)
      })
      .catch(() => {
        if (!cancelled) setComments([])
      })
      .finally(() => {
        if (!cancelled) setLoadingComments(false)
      })

    if (authed) {
      fetchMyRating(product.id)
        .then((score) => {
          if (!cancelled) setMyScore(score)
        })
        .catch(() => {
          if (!cancelled) setMyScore(null)
        })
    }

    return () => {
      cancelled = true
    }
  }, [product.id, authed])

  const handleRate = useCallback(
    async (score) => {
      if (!authed) {
        navigate('/login')
        return
      }
      if (ratingBusy || score === myScore) return
      setRatingBusy(true)
      try {
        const result = await submitRating(product.id, score)
        setMyScore(result.score)
        onRated?.({ rating: result.rating, reviewCount: result.reviewCount })
        toast.success('Calificación guardada')
      } catch (err) {
        toast.error(err?.message || 'No pudimos guardar tu calificación.')
      } finally {
        setRatingBusy(false)
      }
    },
    [authed, ratingBusy, myScore, product.id, onRated, navigate]
  )

  const handleComment = useCallback(async () => {
    const value = text.trim()
    if (!value || sendingComment) return
    if (!authed) {
      navigate('/login')
      return
    }
    setSendingComment(true)
    try {
      const comment = await createComment(product.id, value)
      setComments((prev) => [comment, ...prev])
      setText('')
      toast.success('Comentario publicado')
    } catch (err) {
      toast.error(err?.message || 'No pudimos publicar tu comentario.')
    } finally {
      setSendingComment(false)
    }
  }, [text, sendingComment, authed, product.id, navigate])

  const handleDelete = useCallback(async (comment) => {
    if (!window.confirm('¿Eliminar este comentario?')) return
    try {
      await deleteComment(comment.id)
      setComments((prev) => prev.filter((item) => item.id !== comment.id))
      toast.success('Comentario eliminado')
    } catch (err) {
      toast.error(err?.message || 'No pudimos eliminar el comentario.')
    }
  }, [])

  const displayScore = hoverScore || myScore
  const reviewCount = product.reviewCount ?? 0

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springReveal, delay: 0.28 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-2xl font-bold text-[var(--color-dark)]"
            style={{ fontFamily: 'var(--font-title)' }}
          >
            Reseñas ({reviewCount})
          </h2>
          {product.rating != null && (
            <div className="flex items-center gap-1.5">
              <Stars value={Math.round(product.rating)} size="w-5 h-5" />
              <span className="font-bold text-[var(--color-dark)]">
                {Number(product.rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {!isOwner && (
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)] mb-5">
            <p className="font-bold text-sm text-[var(--color-dark)] mb-1">
              Tu calificación
            </p>
            <p className="text-xs text-[var(--color-concrete)] mb-3">
              {authed
                ? 'Calificá este producto de 1 a 5 estrellas.'
                : 'Iniciá sesión para calificar y comentar.'}
            </p>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Tu calificación">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={myScore === value}
                  aria-label={`${value} de 5 estrellas — ${RATING_LABELS[value]}`}
                  disabled={ratingBusy}
                  className={`p-1 rounded transition-transform disabled:opacity-60 ${
                    value <= displayScore
                      ? 'text-[var(--color-amber-400)]'
                      : 'text-[var(--color-border)] hover:text-[var(--color-amber-400)]'
                  }`}
                  onMouseEnter={() => setHoverScore(value)}
                  onMouseLeave={() => setHoverScore(0)}
                  onFocus={() => setHoverScore(value)}
                  onBlur={() => setHoverScore(0)}
                  onClick={() => handleRate(value)}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d={STAR_PATH} />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-[var(--color-dark)] mt-2 h-4">
              {displayScore > 0 ? RATING_LABELS[displayScore] : '\u00A0'}
            </p>
            {myScore != null && !ratingBusy && (
              <p className="text-xs text-[var(--color-concrete)]">
                Tu calificación: {myScore} de 5. Podés cambiarla cuando quieras.
              </p>
            )}
          </div>
        )}

        {!isOwner && (
          <div className="mb-6">
            <label
              htmlFor="comment-input"
              className="block text-sm font-bold text-[var(--color-dark)] mb-2"
            >
              Dejá un comentario
            </label>
            <textarea
              id="comment-input"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-dark)] placeholder:text-[var(--color-concrete)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
              placeholder={
                authed
                  ? 'Contá cómo fue tu experiencia...'
                  : 'Iniciá sesión para comentar...'
              }
              value={text}
              disabled={!authed || sendingComment}
              onChange={(e) => {
                if (e.target.value.length <= MAX_COMMENT_LENGTH) {
                  setText(e.target.value)
                }
              }}
              rows={3}
              maxLength={MAX_COMMENT_LENGTH}
            />
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xs ${
                  text.length >= MAX_COMMENT_LENGTH
                    ? 'text-[var(--color-error)]'
                    : 'text-[var(--color-concrete)]'
                }`}
              >
                {text.length}/{MAX_COMMENT_LENGTH}
              </span>
              <motion.button
                type="button"
                className="px-5 py-2 rounded-full bg-[var(--color-primary)] text-[var(--color-dark)] text-sm font-bold disabled:opacity-60"
                whileTap={{ scale: 0.96 }}
                transition={springLatch}
                disabled={!authed || sendingComment || text.trim().length === 0}
                onClick={handleComment}
              >
                {sendingComment ? 'Publicando...' : 'Publicar'}
              </motion.button>
            </div>
          </div>
        )}

        {loadingComments ? (
          <Skeleton rows={2} />
        ) : comments.length === 0 ? (
          <p className="text-sm text-[var(--color-concrete)]">
            Todavía no hay comentarios. Sé el primero en comentar.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ ...springReveal, delay: Math.min(index % 3 * 0.03, 0.1) }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-concrete-surface)] flex items-center justify-center overflow-hidden text-[var(--color-concrete)] font-semibold text-xs">
                      {comment.avatar ? (
                        <img
                          src={comment.avatar}
                          alt={comment.author}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        initialsOf(comment.author)
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-dark)] text-sm">
                        {comment.author}
                      </p>
                      <p className="text-xs text-[var(--color-concrete)]">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {comment.rating != null && <Stars value={comment.rating} />}
                    {comment.authorId === userId || user?.role === 'ADMIN' ? (
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full text-[var(--color-concrete)] hover:text-[var(--color-error)] hover:bg-[var(--color-concrete-surface)] transition-colors"
                        onClick={() => handleDelete(comment)}
                        aria-label="Eliminar comentario"
                      >
                        <i className="fas fa-trash text-xs" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-[var(--color-concrete)] leading-relaxed whitespace-pre-line">
                  {comment.text}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {!authed && (
          <p className="mt-4 text-sm text-[var(--color-concrete)]">
            <Link
              to="/login"
              className="font-semibold text-[var(--color-dark)] underline underline-offset-4 hover:text-[var(--color-brown)] transition-colors"
            >
              Iniciá sesión
            </Link>{' '}
            para sumar tu calificación y tus comentarios.
          </p>
        )}
      </motion.div>
    </MotionConfig>
  )
}

export default ProductReviews
