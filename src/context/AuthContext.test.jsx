import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from './AuthContext.jsx'
import { useAuth } from './useAuth'

// Mocks de la capa de servicios: aíslan la máquina de estados del proveedor
// del transporte HTTP real (cookie + CSRF).
const {
  fetchUserDataMock,
  loginMock,
  logoutMock,
  fetchCsrfMock,
  clearCsrfMock,
} = vi.hoisted(() => ({
  fetchUserDataMock: vi.fn(),
  loginMock: vi.fn(),
  logoutMock: vi.fn(),
  fetchCsrfMock: vi.fn(),
  clearCsrfMock: vi.fn(),
}))

vi.mock('../services/auth.service', () => ({
  fetchUserData: fetchUserDataMock,
  login: loginMock,
  logout: logoutMock,
  register: vi.fn(),
  forgotPassword: vi.fn(),
}))

vi.mock('../services/csrf', () => ({
  fetchCsrf: fetchCsrfMock,
  clearCsrf: clearCsrfMock,
}))

// Consumidor mínimo que expone el estado observable del AuthProvider.
function Probe() {
  const { status, user, userId, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user-id">{userId ?? 'none'}</span>
      <span data-testid="user-email">{user?.email ?? 'none'}</span>
      <button onClick={() => login({ email: 'a@b.c', password: 'x' })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  )
}

const statusEl = () => screen.getByTestId('status')
const userIdEl = () => screen.getByTestId('user-id')

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('bootstrap con cookie válida resuelve authed sin premature guest', async () => {
    fetchUserDataMock.mockResolvedValue({ id: 42, email: 'a@b.c' })
    fetchCsrfMock.mockResolvedValue('csrf-1')

    renderProvider()

    // Durante la resolución inicial el gate expone `loading` (nunca guest),
    // evitando una redirección prematura a /login.
    expect(statusEl()).toHaveTextContent('loading')

    await waitFor(() => expect(statusEl()).toHaveTextContent('authed'))
    expect(userIdEl()).toHaveTextContent('42')
    expect(screen.getByTestId('user-email')).toHaveTextContent('a@b.c')
  })

  it('sin cookie resuelve guest ante 401', async () => {
    fetchUserDataMock.mockRejectedValue(
      Object.assign(new Error('unauthorized'), { code: 'AUTH_UNAUTHORIZED', status: 401 })
    )
    fetchCsrfMock.mockResolvedValue(null)

    renderProvider()

    await waitFor(() => expect(statusEl()).toHaveTextContent('guest'))
    expect(userIdEl()).toHaveTextContent('none')
  })

  it('error de red resuelve guest sin crash', async () => {
    fetchUserDataMock.mockRejectedValue(new TypeError('network down'))
    fetchCsrfMock.mockResolvedValue(null)

    renderProvider()

    await waitFor(() => expect(statusEl()).toHaveTextContent('guest'))
    expect(userIdEl()).toHaveTextContent('none')
  })

  it('respuesta sin usuario (null) resuelve guest, nunca authed', async () => {
    // p. ej. el HTML de un SPA fallback parseado a null cuando la API no responde JSON.
    fetchUserDataMock.mockResolvedValue(null)
    fetchCsrfMock.mockResolvedValue(null)

    renderProvider()

    await waitFor(() => expect(statusEl()).toHaveTextContent('guest'))
    expect(userIdEl()).toHaveTextContent('none')
  })

  it('login exitoso: 204 → refresh CSRF + fetchUserData → authed', async () => {
    const user = userEvent.setup()

    // Bootstrap sin sesión.
    fetchUserDataMock.mockRejectedValueOnce(new Error('401'))
    fetchCsrfMock.mockResolvedValue(null)
    renderProvider()
    await waitFor(() => expect(statusEl()).toHaveTextContent('guest'))

    // Login: 204 sin body → re-fetch de CSRF y del usuario autenticado.
    loginMock.mockResolvedValue(null)
    fetchUserDataMock.mockResolvedValue({ id: 7, email: 'a@b.c' })
    fetchCsrfMock.mockResolvedValue('csrf-2')

    await user.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => expect(statusEl()).toHaveTextContent('authed'))
    expect(userIdEl()).toHaveTextContent('7')
    expect(screen.getByTestId('user-email')).toHaveTextContent('a@b.c')
  })

  it('logout: 204 → clearCsrf + guest', async () => {
    fetchUserDataMock.mockResolvedValue({ id: 42, email: 'a@b.c' })
    fetchCsrfMock.mockResolvedValue('csrf-1')
    renderProvider()
    await waitFor(() => expect(statusEl()).toHaveTextContent('authed'))

    logoutMock.mockResolvedValue(null)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'logout' }))

    await waitFor(() => expect(statusEl()).toHaveTextContent('guest'))
    expect(clearCsrfMock).toHaveBeenCalled()
    expect(userIdEl()).toHaveTextContent('none')
  })
})
