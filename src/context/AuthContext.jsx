import { createContext, useState } from 'react'
import * as authService from '../services/auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password })
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUser({ email })
    return data
  }

  const register = async (formData) => {
    const data = await authService.register(formData)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
