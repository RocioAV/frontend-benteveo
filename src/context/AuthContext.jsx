import { createContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/auth.service'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

// Decodifica el payload (base64url) de un JWT sin dependencias externas.
// El claim `sub` (segundo segmento) contiene el id del usuario autenticado.
function decodeJwtPayload(token) {
  try {
    const segment = token.split('.')[1]
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function purgeMockTokens() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('mock-token-')) {
      localStorage.removeItem(key)
    }
  })
}

function degradeToStoredUser() {
  const stored = readStoredUser()
  return stored && stored.email ? stored : null
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)

  // Id del usuario autenticado: del claim `sub` del JWT, con fallback a `user.id`.
  const userId = useMemo(() => {
    const payload = token ? decodeJwtPayload(token) : null
    return payload?.sub ?? user?.id ?? null
  }, [token, user])

  useEffect(() => {
    purgeMockTokens()

    if (!localStorage.getItem(TOKEN_KEY)) return

    let cancelled = false

    authService
      .fetchUserData()
      .then((data) => {
        if (cancelled) return
        if (data && data.email) {
          setUser(data)
        } else {
          setUser(degradeToStoredUser())
        }
      })
      .catch(() => {
        if (cancelled) return
        setUser(degradeToStoredUser())
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password })
    localStorage.setItem(TOKEN_KEY, data.access_token)
    setToken(data.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify({ email }))

    try {
      const profile = await authService.fetchUserData()
      setUser(profile && profile.email ? profile : { email })
    } catch {
      setUser({ email })
    }

    return data
  }

  const register = async (formData) => {
    const data = await authService.register(formData)
    return data
  }

  const forgotPassword = async (email) => {
    return authService.forgotPassword(email)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    purgeMockTokens()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, userId, login, register, logout, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext