import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

function validateEmail(email) {
  if (!email) return 'Ingresá tu correo electrónico'
  if (!EMAIL_REGEX.test(email)) return 'Ingresá un correo electrónico válido'
  return ''
}

function ForgotPassword() {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    const issue = validateEmail(email)
    setEmailError(issue)
    if (issue) return

    setLoading(true)

    try {
      await forgotPassword(email)
      toast.success('Te enviamos un correo para recuperar tu contraseña')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'No pudimos procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full flex-1 min-h-[calc(100vh-160px)]">
        <motion.div
          className="flex flex-1 items-center justify-center px-6 py-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springReveal}
        >
          <div className="w-full max-w-[26rem] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] px-8 py-10">
            <h1 className="text-[var(--color-dark)] text-[1.75rem] font-extrabold tracking-[-0.01em] mb-2">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-[var(--color-concrete)] text-[0.95rem] mb-7">
              Ingresá tu correo electrónico y te enviaremos un enlace para restablecerla.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-[var(--color-dark)] text-[0.85rem] font-semibold mb-2" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  className={`w-full px-4 py-[0.8rem] rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[var(--color-dark)] text-[0.95rem] border transition-colors focus:outline-none focus:border-[var(--color-primary)] ${emailError ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'}`}
                  placeholder="Introduce tu correo electrónico"
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError(validateEmail(e.target.value))
                  }}
                  required
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
                {emailError && (
                  <p id="email-error" className="text-[var(--color-error)] text-[0.8rem] mt-1.5" role="alert">
                    {emailError}
                  </p>
                )}
              </div>
              <div className="mt-8 flex flex-col gap-y-4">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full py-[0.9rem] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-dark)] text-base font-bold shadow-[var(--shadow-md)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                  whileTap={{ scale: 0.96 }}
                  transition={springLatch}
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </motion.button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="self-center font-semibold text-[0.9rem] text-[var(--color-brown)] underline underline-offset-2 transition-colors hover:text-[var(--color-dark)]"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </MotionConfig>
  )
}

export default ForgotPassword
