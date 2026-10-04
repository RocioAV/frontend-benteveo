import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RequireAuth from './RequireAuth.jsx'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('../context/useAuth', () => ({
  useAuth: useAuthMock,
}))

function renderProtected(status) {
  useAuthMock.mockReturnValue({ status })
  return render(
    <MemoryRouter initialEntries={['/protegido']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/protegido"
          element={
            <RequireAuth>
              <div>Contenido protegido</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireAuth', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  it('loading no redirige: muestra spinner', () => {
    renderProtected('loading')

    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument()
  })

  it('guest redirige a /login', () => {
    renderProtected('guest')

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('authed renderiza los children', () => {
    renderProtected('authed')

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })
})
