import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const { login } = useAuth()

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

  return (
    <div className="flex w-full flex-1">
      {/*ocupa lado izquierdo */}
      <div className="w-full flex items-center justify-center lg:w-1/2">
        <div className="bg-white px-10 py-8 rounded-3xl border-2 border-gray-100">
          <h1 className="text-3xl font-semibold">Bienvenido de nuevo</h1>
          <p className="font-medium text-gray-500 mt-2">¡Bienvenido de nuevo! Por favor, introduzca sus datos.</p>
          <form onSubmit={handleSubmit} className="mt-5">
            <div>
              <label className="text-base font-medium" htmlFor="email">Correo electrónico</label>
              <input
                className={`w-full border-2 rounded-xl p-3 mt-1 bg-transparent ${emailError ? 'border-red-400' : 'border-gray-100'}`}
                placeholder="Introduce tu correo electronico"
                type="email"
                id="email"
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
                <p id="email-error" className="text-sm text-red-500 mt-1" role="alert">
                  {emailError}
                </p>
              )}
            </div>
            <div>
              <label className="text-base font-medium" htmlFor="password">Contraseña</label>
              <div className="relative">
                <input
                  className={`w-full border-2 rounded-xl p-3 mt-1 bg-transparent pr-12 ${passwordError ? 'border-red-400' : 'border-gray-100'}`}
                  placeholder="Introduce tu contraseña"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-sm text-red-500 mt-1" role="alert">
                  {passwordError}
                </p>
              )}
            </div>
            <div className="mt-5 flex justify-between items-center">
              <div>
                <input type="checkbox" id="remember" />
                <label className="ml-2 font-medium text-base" htmlFor="remember">Recuerda durante 30 dias</label>
              </div>
              <button type="button" className="font-medium text-base text-amber-500" onClick={() => navigate('/forgot-password')}>Has olvidado tu contraseña</button>
            </div>
            {formError && (
              <div className="mt-5 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600" role="alert">
                {formError}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-y-3">
              <button
                type="submit"
                disabled={loading}
                className="active:scale-[.98] active:duration-75 hover:scale-[1.01] ease-in-out transition-all py-3 rounded-xl bg-amber-500 text-white text-lg font-bold disabled:opacity-50"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
              <button type="button" className="active:scale-[.98] active:duration-75 hover:scale-[1.01] ease-in-out transition-all flex rounded-xl py-3 border-2 border-gray-100 items-center justify-center gap-2"><svg width="24" height="24" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"></path><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"></path><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"></path><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"></path></g></svg>Inicia sesión con Google</button>
            </div>
            <div className="mt-3 flex justify-center items-center">
              <p className="font-medium text-base">¿No tienes una cuenta?</p>
              <button type="button" className="text-amber-500 text-base font-medium ml-2" onClick={() => navigate('/register')}>Crear cuenta</button>
            </div>
          </form>
        </div>
      </div>
      {/* ocupa lado derecho */}
      <div className="hidden relative lg:flex h-full w-1/2 items-center justify-center">
        <div className="w-60 h-60 bg-amber-500 rounded-full" />
      </div>
    </div>
  )
}

export default Login
