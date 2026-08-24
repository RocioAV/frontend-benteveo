import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'
import logo from '../assets/BenteveoLogo.png'
import './Registro.css'

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
  const [passwordStrengthLevel, setPasswordStrengthLevel] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [dniError, setDniError] = useState('')
  const [dniInvalidChar, setDniInvalidChar] = useState(false)
  const dniWarningTimeout = useRef(null)
  const [phoneError, setPhoneError] = useState('')
  const [phoneInvalidChar, setPhoneInvalidChar] = useState(false)
  const phoneWarningTimeout = useRef(null)

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

  const getPasswordStrengthLevel = (password) => {
    if (!password) return ''
    let metCount = 0
    if (password.length >= 8) metCount++
    if (/[A-Z]/.test(password)) metCount++
    if (/[a-z]/.test(password)) metCount++
    if (/[0-9]/.test(password)) metCount++
    if (/[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\~`]/.test(password)) metCount++

    if (metCount <= 2) return 'debil'
    if (metCount <= 4) return 'media'
    return 'fuerte'
  }

  const checkEmailFormat = (email) => {
    if (!email) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Ingresá un correo electrónico válido'
    }
    return ''
  }

  const checkPhoneFormat = (phone) => {
    if (!phone) return ''

    if (phone.length === 10) {
      if (phone.startsWith('0')) {
        return 'No incluyas el 0 del código de área'
      }
      if (phone.slice(0, 2) === '15') {
        return 'No incluyas el 15 antes del código de área'
      }
      return ''
    }

    if (phone.length === 13) {
      if (!phone.startsWith('549')) {
        return 'Con 13 números, debe empezar con 549 (código de país)'
      }
      if (phone.startsWith('5490')) {
        return 'No incluyas el 0 del código de área'
      }
      if (phone.slice(3, 5) === '15') {
        return 'No incluyas el 15 antes del código de área'
      }
      return ''
    }

    return 'Ingresá 10 números (área + línea) o 13 con el 549 adelante'
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    const cleanedValue = name === 'dni'
      ? value.replace(/\D/g, '')
      : name === 'phone'
        ? value.replace(/\D/g, '').slice(0, 13)
        : value

    if (name === 'dni' && value !== cleanedValue) {
      setDniInvalidChar(true)
      clearTimeout(dniWarningTimeout.current)
      dniWarningTimeout.current = setTimeout(() => setDniInvalidChar(false), 2000)
    }

    if (name === 'phone' && value !== cleanedValue) {
      setPhoneInvalidChar(true)
      clearTimeout(phoneWarningTimeout.current)
      phoneWarningTimeout.current = setTimeout(() => setPhoneInvalidChar(false), 2000)
    }

    const updatedData = { ...formData, [name]: cleanedValue }
    setFormData(updatedData)

    if (name === 'dni') {
      if (cleanedValue && (cleanedValue.length < 7 || cleanedValue.length > 8)) {
        setDniError('El DNI debe tener 7 u 8 números')
      } else {
        setDniError('')
      }
    }

    if (name === 'phone') {
      setPhoneError(checkPhoneFormat(cleanedValue))
    }

    if (name === 'password') {
      setPasswordStrengthError(checkPasswordStrength(value))
      setPasswordStrengthLevel(getPasswordStrengthLevel(value))
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

    if (loading) return

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

    if (formData.phone) {
      const phoneIssue = checkPhoneFormat(formData.phone)
      if (phoneIssue) {
        setPhoneError(phoneIssue)
        return
      }
    }

    setLoading(true)
    setSubmitError('')
    setSuccessMessage('')

    try {
      const dataToSend = { ...formData }
      delete dataToSend.password2
      await register(dataToSend)
      setSuccessMessage('¡Listo! Te registraste con éxito.')
      toast.success('¡Cuenta creada! Ahora iniciá sesión')
      navigate('/login')
      setFormData({
        name: '',
        email: '',
        password: '',
        password2: '',
        dni: '',
        phone: '',
      })
      setPasswordStrengthLevel('')
    } catch (err) {
      setSubmitError(err.message || 'Hubo un problema al registrarte. Intentá de nuevo.')
      toast.error(err.message || 'Hubo un problema al registrarte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="registro-page">
      <form id="registroForm" onSubmit={handleSubmit}>
        <div className="registro-logo-badge">
          <img src={logo} alt="Logo Benteveo" />
        </div>
        <h2>Bienvenido</h2>
        <h3>¡Sé parte de nuestra comunidad!</h3>

        {successMessage && (
          <div className="registro-form-success" role="status">
            {successMessage}
          </div>
        )}

        {submitError && (
          <div className="registro-form-error" role="alert">
            {submitError}
          </div>
        )}

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
              inputMode="numeric"
              title="Ingresá entre 7 y 8 números, sin puntos"
              value={formData.dni}
              onChange={handleChange}
              className={dniError || dniInvalidChar ? 'input-error' : ''}
              aria-invalid={dniError || dniInvalidChar ? 'true' : 'false'}
              aria-describedby={dniError || dniInvalidChar ? 'dni-error' : undefined}
            />
            {dniInvalidChar ? (
              <span id="dni-error" className="registro-error-message" role="alert">
                Solo se aceptan números
              </span>
            ) : (
              dniError && (
                <span id="dni-error" className="registro-error-message" role="alert">
                  {dniError}
                </span>
              )
            )}
          </div>

          <div className="registro-field">
            <label htmlFor="phone">Teléfono (opcional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="Ej: 3482121212 o 5493482121212"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={13}
              value={formData.phone}
              onChange={handleChange}
              className={phoneError || phoneInvalidChar ? 'input-error' : ''}
              aria-invalid={phoneError || phoneInvalidChar ? 'true' : 'false'}
              aria-describedby={phoneError || phoneInvalidChar ? 'phone-error' : undefined}
            />
            {phoneInvalidChar ? (
              <span id="phone-error" className="registro-error-message" role="alert">
                Solo se aceptan números
              </span>
            ) : phoneError ? (
              <span id="phone-error" className="registro-error-message" role="alert">
                {phoneError}
              </span>
            ) : (
              <span className="registro-hint-message">
                10 números (área sin 0 + línea sin 15), con o sin 549 adelante
              </span>
            )}
          </div>
        </div>

        <div className="registro-field">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
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
          {passwordStrengthError ? (
            <span id="password-strength-error" className="registro-error-message" role="alert">
              {passwordStrengthError}
            </span>
          ) : (
            <span className="registro-hint-message">
              Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo
            </span>
          )}
          {formData.password && (
            <span className={`registro-strength-indicator registro-strength-${passwordStrengthLevel}`}>
              Fortaleza: {passwordStrengthLevel === 'debil' && 'Débil'}
              {passwordStrengthLevel === 'media' && 'Media'}
              {passwordStrengthLevel === 'fuerte' && 'Fuerte'}
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
    </div>
  )
}

export default Registro
