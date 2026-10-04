import { createContext, useEffect, useState } from 'react'
import * as authService from '../services/auth.service'
import { fetchCsrf, clearCsrf } from '../services/csrf'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // `status` resuelve la sesión antes de cualquier gate: loading | authed | guest.
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)

  // user.id deriva SOLO de la sesión autenticada (FAS-5), nunca de localStorage.
  const userId = user?.id ?? null

  // Bootstrap async (FAS-4): resuelve sesión + CSRF en paralelo al montar.
  // 2xx → authed + user; 401 o error de red → guest (sin crash).
  useEffect(() => {
    let cancelled = false

    Promise.all([authService.fetchUserData(), fetchCsrf()])
      .then(([userData]) => {
        if (cancelled) return
        // FAS-5: la sesión solo es válida si el backend devuelve un usuario real
        // (con id). Una respuesta vacía/no-JSON (p. ej. el HTML de un SPA fallback
        // cuando la API no está configurada) NO debe marcar `authed`.
        if (userData && userData.id != null) {
          setUser(userData)
          setStatus('authed')
        } else {
          setStatus('guest')
        }
      })
      .catch(() => {
        if (cancelled) return
        setStatus('guest')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = async ({ email, password }) => {
    await authService.login({ email, password })
    // La sesión cambió: el token CSRF anterior queda inválido. Se limpia la
    // caché antes de pedir el nuevo token junto con el usuario autenticado.
    clearCsrf()
    const [userData] = await Promise.all([authService.fetchUserData(), fetchCsrf()])
    if (userData && userData.id != null) {
      setUser(userData)
      setStatus('authed')
    } else {
      setUser(null)
      setStatus('guest')
    }
  }

  const register = async (formData) => authService.register(formData)

  const forgotPassword = async (email) => authService.forgotPassword(email)

  // Re-fetch del usuario autenticado (p. ej. tras subir el avatar) sin tocar
  // la sesión si el refresh falla. Mantiene `user` y `status` coherentes.
  const refreshUser = async () => {
    try {
      const userData = await authService.fetchUserData()
      if (userData && userData.id != null) {
        setUser(userData)
        setStatus('authed')
      }
    } catch {
      // No degrada la sesión por un fallo puntual del refresh.
    }
  }

  const logout = async () => {
    // Aun si el POST falla (red), el estado local se limpia: el usuario queda
    // deslogueado localmente y las cookies se invalidan en el próximo intento.
    try {
      await authService.logout()
    } finally {
      clearCsrf()
      setUser(null)
      setStatus('guest')
    }
  }

  return (
    <AuthContext.Provider
      value={{ status, user, userId, login, register, logout, forgotPassword, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
