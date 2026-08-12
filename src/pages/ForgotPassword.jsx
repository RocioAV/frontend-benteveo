import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    <div className="flex w-full flex-1">
      <div className="w-full flex items-center justify-center">
        <div className="bg-white px-10 py-16 rounded-3xl border-2 border-gray-100">
          <h1 className="text-4xl font-semibold">¿Olvidaste tu contraseña?</h1>
          <p className="font-medium text-gray-500 mt-4">
            Ingresá tu correo electrónico y te enviaremos un enlace para restablecerla.
          </p>
          <form onSubmit={handleSubmit} className="mt-8">
            <div>
              <label className="text-lg font-medium" htmlFor="email">Correo electrónico</label>
              <input
                className={`w-full border-2 rounded-xl p-4 mt-1 bg-transparent ${emailError ? 'border-red-400' : 'border-gray-100'}`}
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
                <p id="email-error" className="text-sm text-red-500 mt-1" role="alert">
                  {emailError}
                </p>
              )}
            </div>
            <div className="mt-8 flex flex-col gap-y-4">
              <button
                type="submit"
                disabled={loading}
                className="active:scale-[.98] active:duration-75 hover:scale-[1.01] ease-in-out transition-all py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-dark)] text-lg font-bold disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-base text-[var(--color-primary)]"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
