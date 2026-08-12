import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'
import './Login.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

function validateEmail(email) {
  if (!email) return 'Ingresá tu correo electrónico'
  if (!EMAIL_REGEX.test(email)) return 'Ingresá un correo electrónico válido'
  return ''
}

function validatePassword(password) {
  if (!password) return 'Ingresá tu contraseña'
  return ''
}

function EyeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, token } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    const emailIssue = validateEmail(email)
    const passwordIssue = validatePassword(password)

    setEmailError(emailIssue)
    setPasswordError(passwordIssue)
    setFormError('')

    if (emailIssue || passwordIssue) return

    setLoading(true)

    try {
      await login({ email, password })
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err) {
      const message = err.message || 'Correo o contraseña incorrectos'
      setFormError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (token) {
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="login-page">
        <motion.div
          className="login-form-side"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springReveal}
        >
          <div className="login-card">
            <h1 className="login-title">Bienvenido de nuevo</h1>
            <p className="login-sub">Ingresá tus datos para alquilar.</p>
            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="email">Correo electrónico</label>
                <input
                  className={`login-input ${emailError ? 'login-input--error' : ''}`}
                  placeholder="Tu correo electrónico"
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError(validateEmail(e.target.value))
                    setFormError('')
                  }}
                  required
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
                {emailError && (
                  <p id="email-error" className="login-error" role="alert">
                    {emailError}
                  </p>
                )}
              </div>
              <div className="login-field">
                <label className="login-label" htmlFor="password">Contraseña</label>
                <div className="login-password">
                  <input
                    className={`login-input ${passwordError ? 'login-input--error' : ''}`}
                    placeholder="Tu contraseña"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setPasswordError(validatePassword(e.target.value))
                      setFormError('')
                    }}
                    required
                    aria-invalid={passwordError ? 'true' : 'false'}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="login-eye"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {passwordError && (
                  <p id="password-error" className="login-error" role="alert">
                    {passwordError}
                  </p>
                )}
              </div>
              <div className="login-forgot">
                <button type="button" className="login-link" onClick={() => navigate('/forgot-password')}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              {formError && (
                <div className="login-form-error" role="alert">
                  {formError}
                </div>
              )}
              <motion.button
                type="submit"
                disabled={loading}
                className="login-cta"
                whileTap={{ scale: 0.96 }}
                transition={springLatch}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </motion.button>
              <div className="login-register">
                <span>¿No tenés cuenta?</span>
                <button type="button" className="login-link" onClick={() => navigate('/register')}>
                  Crear cuenta
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        <motion.aside
          className="login-brand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="login-brand-inner">
            <p className="login-brand-name">Benteveo</p>
            <p className="login-brand-slogan">Te hace la gauchada</p>
            <p className="login-brand-tagline">
              Alquilá herramientas y cosas del barrio, entre vecinos. Sin comprar, sin que estorbe.
            </p>
          </div>
        </motion.aside>
      </div>
    </MotionConfig>
  )
}

export default Login
