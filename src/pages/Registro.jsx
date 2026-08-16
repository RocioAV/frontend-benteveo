import { useState } from 'react'
import { motion, MotionConfig } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'
import logo from '../assets/BenteveoLogo.png'
import BenteveoBird from '../components/BenteveoBird.jsx'
import './Registro.css'

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

function Registro() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    dni: '',
    phone: '',
  })

  const [passwordError, setPasswordError] = useState('')
  const [passwordStrengthError, setPasswordStrengthError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const checkPasswordStrength = (password) => {
    if (!password) return ''
    if (password.length < 8) {
      return 'Debe tener al menos 8 caracteres'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Debe incluir al menos una mayúscula'
    }
    if (!/[a-z]/.test(password)) {
      return 'Debe incluir al menos una minúscula'
    }
    if (!/[0-9]/.test(password)) {
      return 'Debe incluir al menos un número'
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\~`]/.test(password)) {
      return 'Debe incluir al menos un símbolo (ej: ! @ # $ %)'
    }
    return ''
  }

  const checkEmailFormat = (email) => {
    if (!email) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Ingresá un correo electrónico válido'
    }
    return ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedData = { ...formData, [name]: value }
    setFormData(updatedData)

    if (name === 'password') {
      setPasswordStrengthError(checkPasswordStrength(value))
    }

    if (name === 'email') {
      setEmailError(checkEmailFormat(value))
    }

    if (name === 'password' || name === 'password2') {
      if (updatedData.password2 && updatedData.password !== updatedData.password2) {
        setPasswordError('Las contraseñas no coinciden')
      } else {
        setPasswordError('')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const emailIssue = checkEmailFormat(formData.email)
    if (emailIssue) {
      setEmailError(emailIssue)
      return
    }

    const strengthIssue = checkPasswordStrength(formData.password)
    if (strengthIssue) {
      setPasswordStrengthError(strengthIssue)
      return
    }

    if (formData.password !== formData.password2) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const dataToSend = { ...formData }
      delete dataToSend.password2
      await register(dataToSend)
      toast.success('¡Cuenta creada! Ahora iniciá sesión')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Hubo un problema al registrarte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="registro-layout">
        <button type="button" className="auth-back" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left" aria-hidden="true" /> Volver al inicio
        </button>

        <motion.div
          className="registro-form-side"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <form id="registroForm" onSubmit={handleSubmit}>
        <div className="registro-logo-badge">
          <img src={logo} alt="Logo Benteveo" />
        </div>
        <h1 className="sr-only">Registro de usuario</h1>
        <h2>Bienvenido</h2>
        <h3>¡Sé parte de nuestra comunidad!</h3>

        <div className="registro-grid">
          <div className="registro-field">
            <label htmlFor="name">Nombre completo</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Tu nombre"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="registro-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="Tu correo electrónico"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={emailError ? 'input-error' : ''}
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
            {emailError && (
              <span id="email-error" className="registro-error-message" role="alert">
                {emailError}
              </span>
            )}
          </div>

          <div className="registro-field">
            <label htmlFor="dni">DNI</label>
            <input
              type="text"
              id="dni"
              name="dni"
              required
              placeholder="Tu DNI"
              maxLength={8}
              pattern="[0-9]{7,8}"
              title="Ingresá entre 7 y 8 números, sin puntos"
              autoComplete="off"
              value={formData.dni}
              onChange={handleChange}
            />
          </div>

          <div className="registro-field">
            <label htmlFor="phone">Teléfono</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              placeholder="Tu teléfono"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="registro-field">
          <label htmlFor="password">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              required
              placeholder="Contraseña"
              minLength={8}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className={passwordStrengthError ? 'input-error' : ''}
              aria-invalid={passwordStrengthError ? 'true' : 'false'}
              aria-describedby={passwordStrengthError ? 'password-strength-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {passwordStrengthError ? (
            <span id="password-strength-error" className="registro-error-message" role="alert">
              {passwordStrengthError}
            </span>
          ) : (
            <span className="registro-hint-message">
              Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo
            </span>
          )}
        </div>

        <div className="registro-field">
          <label htmlFor="password2">Repetir contraseña</label>
          <input
            type="password"
            id="password2"
            name="password2"
            required
            placeholder="Repetir contraseña"
            minLength={8}
            autoComplete="new-password"
            value={formData.password2}
            onChange={handleChange}
            className={passwordError ? 'input-error' : ''}
            aria-invalid={passwordError ? 'true' : 'false'}
            aria-describedby={passwordError ? 'password-error' : undefined}
          />
          {passwordError && (
            <span id="password-error" className="registro-error-message" role="alert">
              {passwordError}
            </span>
          )}
        </div>

        <button type="submit" className="registro-submit-btn" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
        </form>
        </motion.div>

        <motion.aside
          className="registro-brand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="registro-brand-inner">
            <BenteveoBird className="registro-brand-bird" />
            <h2>Sumate a la movida del barrio</h2>
            <p>
              Publicá lo que no usás o alquilá lo que necesitás. En Benteveo, tu vecino te hace la
              gauchada.
            </p>
            <ul className="registro-brand-list">
              <li><i className="fas fa-circle-check" aria-hidden="true" /> Alquilá herramientas y equipos cerca</li>
              <li><i className="fas fa-circle-check" aria-hidden="true" /> Ganá dinero con lo que tenés guardado</li>
              <li><i className="fas fa-circle-check" aria-hidden="true" /> Pagos protegidos con MercadoPago</li>
            </ul>
          </div>
        </motion.aside>
      </div>
    </MotionConfig>
  )
}

export default Registro
