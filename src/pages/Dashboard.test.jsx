import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard.jsx'

const {
  fetchProductsMock,
  fetchMyReservationsMock,
  fetchReservationsAsOwnerMock,
  updateProfileMock,
  useAuthMock,
  refreshUserMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  fetchProductsMock: vi.fn(),
  fetchMyReservationsMock: vi.fn(),
  fetchReservationsAsOwnerMock: vi.fn(),
  updateProfileMock: vi.fn(),
  useAuthMock: vi.fn(),
  refreshUserMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}))

vi.mock('../services/products.service.js', () => ({
  fetchProducts: fetchProductsMock,
  deleteProduct: vi.fn(),
  toggleAvailability: vi.fn(),
}))

vi.mock('../services/reservations.service.js', () => ({
  fetchMyReservations: fetchMyReservationsMock,
  fetchReservationsAsOwner: fetchReservationsAsOwnerMock,
  cancelReservation: vi.fn(),
  confirmReservation: vi.fn(),
  handoffReservation: vi.fn(),
  returnReservation: vi.fn(),
}))

vi.mock('../services/profile.service.js', () => ({
  uploadAvatar: vi.fn(),
  updateProfile: updateProfileMock,
}))

vi.mock('../context/useAuth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
    info: vi.fn(),
  },
}))

// motion se aísla: el foco es la persistencia del perfil, no las animaciones.
vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => tag,
    },
  ),
  MotionConfig: ({ children }) => children,
  AnimatePresence: ({ children }) => children,
}))

const baseUser = {
  id: 'user-1',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  dni: '30123456',
  isIdentityVerified: false,
  profile: {
    phone: '1123456789',
    description: 'Vecino de La Plata.',
    avatar: null,
  },
}

function renderDashboard(user = baseUser) {
  useAuthMock.mockReturnValue({
    user,
    userId: user.id,
    logout: vi.fn(),
    refreshUser: refreshUserMock,
  })
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Dashboard />
    </MemoryRouter>,
  )
}

async function openEditForm() {
  const user = userEvent.setup()
  renderDashboard()
  await user.click(await screen.findByRole('button', { name: /editar información/i }))
  await screen.findByLabelText(/nombre completo/i)
  return user
}

const ALLOWED_KEYS = ['name', 'phone', 'description']

function expectNoForbiddenFields(payload) {
  expect(Object.keys(payload).every((key) => ALLOWED_KEYS.includes(key))).toBe(true)
  expect(payload).not.toHaveProperty('bio')
  expect(payload).not.toHaveProperty('email')
  expect(payload).not.toHaveProperty('dni')
  expect(payload).not.toHaveProperty('id')
  expect(payload).not.toHaveProperty('avatar')
}

describe('Dashboard — edición de perfil', () => {
  beforeEach(() => {
    fetchProductsMock.mockReset()
    fetchMyReservationsMock.mockReset()
    fetchReservationsAsOwnerMock.mockReset()
    updateProfileMock.mockReset()
    useAuthMock.mockReset()
    refreshUserMock.mockReset()
    toastSuccessMock.mockReset()
    toastErrorMock.mockReset()
    fetchProductsMock.mockResolvedValue([])
    fetchMyReservationsMock.mockResolvedValue([])
    fetchReservationsAsOwnerMock.mockResolvedValue([])
    updateProfileMock.mockResolvedValue({ id: 'user-1' })
    refreshUserMock.mockResolvedValue(undefined)
  })

  it('envía solo el nombre cambiado, refresca y cierra el formulario al guardar', async () => {
    const user = await openEditForm()

    const nameInput = screen.getByLabelText(/nombre completo/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Juan Actualizado')

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => expect(updateProfileMock).toHaveBeenCalledTimes(1))
    const payload = updateProfileMock.mock.calls[0][0]
    expect(payload).toEqual({ name: 'Juan Actualizado' })
    expectNoForbiddenFields(payload)
    expect(refreshUserMock).toHaveBeenCalledTimes(1)
    expect(toastSuccessMock).toHaveBeenCalledWith('Perfil actualizado.')
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /guardar cambios/i })).not.toBeInTheDocument(),
    )
  })

  it('mapea la bio vacía a description vacía para permitir limpiar la presentación', async () => {
    const user = await openEditForm()

    await user.clear(screen.getByLabelText(/sobre mí/i))
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => expect(updateProfileMock).toHaveBeenCalledTimes(1))
    const payload = updateProfileMock.mock.calls[0][0]
    expect(payload).toEqual({ description: '' })
    expectNoForbiddenFields(payload)
    expect(refreshUserMock).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /guardar cambios/i })).not.toBeInTheDocument(),
    )
  })

  it('mantiene el formulario abierto y muestra el detalle por campo si el backend rechaza', async () => {
    const user = await openEditForm()
    updateProfileMock.mockRejectedValue({
      code: 'VALIDATION_FAILED',
      status: 422,
      fields: { name: 'El nombre debe tener entre 3 y 50 caracteres.' },
      message: 'Error de validación',
    })

    const nameInput = screen.getByLabelText(/nombre completo/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'x')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        'El nombre debe tener entre 3 y 50 caracteres.',
      ),
    )
    // El formulario sigue abierto y el botón vuelve a habilitarse.
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    const saveButton = screen.getByRole('button', { name: /guardar cambios/i })
    expect(saveButton).not.toBeDisabled()
    expect(refreshUserMock).not.toHaveBeenCalled()
  })

  it('envía el nombre vaciado tal cual (sin sustituir el valor anterior) y conserva el error', async () => {
    const user = await openEditForm()
    updateProfileMock.mockRejectedValue({
      code: 'VALIDATION_FAILED',
      status: 422,
      fields: { name: 'El nombre no puede estar vacío.' },
      message: 'Error de validación',
    })

    await user.clear(screen.getByLabelText(/nombre completo/i))
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => expect(updateProfileMock).toHaveBeenCalledTimes(1))
    const payload = updateProfileMock.mock.calls[0][0]
    expect(payload.name).toBe('')
    expect(payload.name).not.toBe(baseUser.name)
    expectNoForbiddenFields(payload)
    expect(toastErrorMock).toHaveBeenCalledWith('El nombre no puede estar vacío.')
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(refreshUserMock).not.toHaveBeenCalled()
  })

  it('previene envíos duplicados con estado de guardado y botón deshabilitado', async () => {
    const user = await openEditForm()
    let resolveUpdate
    updateProfileMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve
        }),
    )

    const nameInput = screen.getByLabelText(/nombre completo/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Juan Sin Duplicados')

    const saveButton = screen.getByRole('button', { name: /guardar cambios/i })
    await user.click(saveButton)
    await user.click(saveButton)

    await waitFor(() => expect(updateProfileMock).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled()

    resolveUpdate({ id: 'user-1' })

    await waitFor(() => expect(refreshUserMock).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /guardando/i })).not.toBeInTheDocument(),
    )
  })
})
