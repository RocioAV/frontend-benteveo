import { createContext, useEffect, useState } from 'react'
import * as authService from '../services/auth.service'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

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
    <AuthContext.Provider value={{ token, user, login, register, logout, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext