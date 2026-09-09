import { useState } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'
import { toast } from 'react-toastify'
import { submitVerification } from '../../services/verification.service.js'
import './VerificationModal.css'

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

const STEPS = [
  { key: 'front', label: 'Frente del DNI', icon: 'fa-id-card', hint: 'Foto del frente de tu documento' },
  { key: 'back', label: 'Dorso del DNI', icon: 'fa-id-card-clip', hint: 'Foto del dorso de tu documento' },
  { key: 'selfie', label: 'Selfie', icon: 'fa-user', hint: 'Foto de tu rostro sosteniendo el DNI' },
]

const EMPTY = { front: null, back: null, selfie: null }

function VerificationModal({ open, onClose }) {
  const [step, setStep] = useState(0)
  const [images, setImages] = useState(EMPTY)
  const [previews, setPreviews] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const current = STEPS[step]
  const canContinue = images[current.key] !== null

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImages((prev) => ({ ...prev, [current.key]: file }))
    setPreviews((prev) => ({ ...prev, [current.key]: URL.createObjectURL(file) }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await submitVerification(images)
      setDone(true)
      toast.success('Verificación enviada. Esperá la aprobación del administrador.')
    } catch (err) {
      toast.error(err.message || 'No pudimos enviar la verificación.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setStep(0)
    setImages(EMPTY)
    setPreviews(EMPTY)
    setSubmitting(false)
    setDone(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <MotionConfig reducedMotion="user">
          <div className="verification-modal" role="dialog" aria-modal="true" aria-label="Verificar identidad">
            <motion.div
              className="verification-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />
            <motion.div
              className="verification-panel"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={springReveal}
            >
              <button type="button" className="verification-close" onClick={handleClose} aria-label="Cerrar">
                <i className="fas fa-xmark" aria-hidden="true" />
              </button>

              {done ? (
                <div className="verification-done">
                  <span className="verification-done-icon">
                    <i className="fas fa-clock" aria-hidden="true" />
                  </span>
                  <h2 className="verification-title">Verificación enviada</h2>
                  <p className="verification-sub">
                    Tu DNI está en revisión. Te avisaremos cuando un administrador lo apruebe.
                  </p>
                  <motion.button
                    type="button"
                    className="verification-btn"
                    whileTap={{ scale: 0.96 }}
                    transition={springLatch}
                    onClick={handleClose}
                  >
                    Entendido
                  </motion.button>
                </div>
              ) : (
                <>
                  <h2 className="verification-title">Verificar identidad</h2>
                  <p className="verification-sub">
                    Para reservar y publicar necesitás verificar tu identidad con DNI.
                  </p>

                  <ol className="verification-steps">
                    {STEPS.map((s, i) => (
                      <li
                        key={s.key}
                        className={[
                          'verification-step',
                          i < step ? 'verification-step--done' : '',
                          i === step ? 'verification-step--active' : '',
                        ].join(' ').trim()}
                      >
                        <span className="verification-step-num">
                          {i < step ? <i className="fas fa-check" aria-hidden="true" /> : i + 1}
                        </span>
                        <span className="verification-step-label">{s.label}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="verification-body">
                    <label className="verification-dropzone" htmlFor={`file-${current.key}`}>
                      {previews[current.key] ? (
                        <img src={previews[current.key]} alt={current.label} />
                      ) : (
                        <>
                          <i className={`fas ${current.icon}`} aria-hidden="true" />
                          <span className="verification-dropzone-title">{current.hint}</span>
                          <small>Hacé clic para subir la foto</small>
                        </>
                      )}
                    </label>
                    <input
                      id={`file-${current.key}`}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleFile}
                    />
                    {previews[current.key] ? (
                      <button type="button" className="verification-change" onClick={() => setPreviews((p) => ({ ...p, [current.key]: null }))}>
                        Cambiar foto
                      </button>
                    ) : null}
                  </div>

                  <div className="verification-actions">
                    {step > 0 ? (
                      <button type="button" className="verification-btn verification-btn--ghost" onClick={() => setStep((s) => s - 1)}>
                        Volver
                      </button>
                    ) : null}
                    {step < STEPS.length - 1 ? (
                      <motion.button
                        type="button"
                        className="verification-btn"
                        disabled={!canContinue}
                        whileTap={{ scale: 0.96 }}
                        transition={springLatch}
                        onClick={() => setStep((s) => s + 1)}
                      >
                        Continuar
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        className="verification-btn"
                        disabled={!canContinue || submitting}
                        whileTap={{ scale: 0.96 }}
                        transition={springLatch}
                        onClick={handleSubmit}
                      >
                        {submitting ? 'Enviando…' : 'Enviar para verificación'}
                      </motion.button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </MotionConfig>
      ) : null}
    </AnimatePresence>
  )
}

export default VerificationModal
