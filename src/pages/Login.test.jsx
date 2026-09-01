import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Login from './Login.jsx'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('../context/useAuth', () => ({
  useAuth: useAuthMock,
}))

// GoogleAuthButton usa motion + toast; se aísla para no depender de esos módulos.
vi.mock('../components/GoogleAuthButton', () => ({
  default: () => <button type="button">Google</button>,
}))

function renderLogin(status) {
  useAuthMock.mockReturnValue({ status, login: vi.fn() })
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Login', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  it('authed redirige (Navigate) en lugar de mostrar el form', () => {
    renderLogin('authed')

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('loading muestra spinner', () => {
    renderLogin('loading')

    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })
})
