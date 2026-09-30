import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard.jsx'

const {
  fetchProductsMock,
  fetchMyReservationsMock,
  fetchReservationsAsOwnerMock,
  handoffReservationMock,
  fetchMyUserRatingMock,
  submitUserRatingMock,
  useAuthMock,
} = vi.hoisted(() => ({
  fetchProductsMock: vi.fn(),
  fetchMyReservationsMock: vi.fn(),
  fetchReservationsAsOwnerMock: vi.fn(),
  handoffReservationMock: vi.fn(),
  fetchMyUserRatingMock: vi.fn(),
  submitUserRatingMock: vi.fn(),
  useAuthMock: vi.fn(),
}))

vi.mock('../services/products.service.js', () => ({
  fetchProducts: fetchProductsMock,
  deleteProduct: vi.fn(),
  toggleAvailability: vi.fn(),
}))

vi.mock('../services/favorites.service.js', () => ({
  fetchFavorites: vi.fn().mockResolvedValue([]),
}))

vi.mock('../services/reservations.service.js', () => ({
  fetchMyReservations: fetchMyReservationsMock,
  fetchReservationsAsOwner: fetchReservationsAsOwnerMock,
  cancelReservation: vi.fn(),
  handoffReservation: handoffReservationMock,
  confirmHandoffReceipt: vi.fn(),
  returnReservation: vi.fn(),
  confirmReturnReceipt: vi.fn(),
}))

vi.mock('../services/user-ratings.service.js', () => ({
  fetchMyUserRating: fetchMyUserRatingMock,
  submitUserRating: submitUserRatingMock,
}))

vi.mock('../services/profile.service.js', () => ({
  uploadAvatar: vi.fn(),
  updateProfile: vi.fn(),
}))

vi.mock('../context/useAuth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('../context/useFavorites', () => ({
  useFavorites: () => ({ favoriteIds: [], isFavorite: () => false }),
}))

vi.mock('../components/modals/reservationDetail.map.js', () => ({
  fetchReservationDetail: vi.fn(),
}))

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

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

function reservation(overrides = {}) {
  return {
    id: 'res-1',
    status: 'COMPLETED',
    actualHandoffAt: '2026-09-30T10:00:00.000Z',
    renterReceivedAt: '2026-09-30T11:00:00.000Z',
    renterReturnedAt: '2026-09-30T12:00:00.000Z',
    actualReturnAt: '2026-09-30T13:00:00.000Z',
    createdAt: '2026-09-20T10:00:00.000Z',
    dateInit: '2026-12-10T12:00:00.000Z',
    dateEnd: '2026-12-12T12:00:00.000Z',
    user: { name: 'Inquilino Uno' },
    product: { id: 'prod-1', title: 'Taladro', pricePerDay: 5000, imageUrl: null },
    ...overrides,
  }
}

function renderReservas() {
  useAuthMock.mockReturnValue({
    user: { id: 'user-1', name: 'Dueño Uno', email: 'dueno@example.com' },
    userId: 'user-1',
    logout: vi.fn(),
    refreshUser: vi.fn(),
  })
  return render(
    <MemoryRouter initialEntries={['/dashboard?tab=reservas']}>
      <Dashboard />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fetchProductsMock.mockReset().mockResolvedValue([])
  fetchMyReservationsMock.mockReset().mockResolvedValue([])
  fetchReservationsAsOwnerMock.mockReset().mockResolvedValue([])
  handoffReservationMock.mockReset()
  fetchMyUserRatingMock.mockReset()
  submitUserRatingMock.mockReset()
  useAuthMock.mockReset()
})

describe('Dashboard — hidratación del estado de calificación', () => {
  it('COMPLETED + rated:true nunca muestra `Calificar`: checking y luego `Ya calificaste` automáticos', async () => {
    fetchMyReservationsMock.mockResolvedValue([reservation()])
    let resolveMine
    fetchMyUserRatingMock.mockImplementation(
      () => new Promise((resolve) => { resolveMine = resolve }),
    )
    renderReservas()

    // Mientras hidrata no hay acción falsa: solo el estado deshabilitado.
    expect(await screen.findByRole('button', { name: /verificando/i })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    await waitFor(() => expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1))

    resolveMine({ rated: true, rating: { id: 'rating-1', score: 5 } })

    expect(await screen.findByText(/ya calificaste esta reserva \(5\/5\)/i)).toBeInTheDocument()
    // Sin clic del usuario: el modal nunca aparece y no hay POST posible.
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1)
    expect(submitUserRatingMock).not.toHaveBeenCalled()
  })

  it('COMPLETED + rated:false muestra `Calificar` solo tras hidratar, sin re-verificar al abrir', async () => {
    fetchMyReservationsMock.mockResolvedValue([reservation()])
    let resolveMine
    fetchMyUserRatingMock.mockImplementation(
      () => new Promise((resolve) => { resolveMine = resolve }),
    )
    const user = userEvent.setup()
    renderReservas()

    expect(await screen.findByRole('button', { name: /verificando/i })).toBeDisabled()
    await waitFor(() => expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1))

    resolveMine({ rated: false, rating: null })
    await user.click(await screen.findByRole('button', { name: /^calificar/i }))

    // El modal abre directo: la hidratación ya confirmó rated:false.
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1)
    expect(submitUserRatingMock).not.toHaveBeenCalled()
  })

  it('copias dueño/inquilino de la misma reserva generan un único pedido', async () => {
    const shared = reservation()
    fetchMyReservationsMock.mockResolvedValue([shared])
    fetchReservationsAsOwnerMock.mockResolvedValue([{ ...shared }])
    fetchMyUserRatingMock.mockResolvedValue({ rated: true, rating: { score: 4 } })
    const user = userEvent.setup()
    renderReservas()

    expect(await screen.findByText(/ya calificaste esta reserva/i)).toBeInTheDocument()

    // Cambiar de tab re-renderiza sin rehidratar.
    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    expect(await screen.findByText(/ya calificaste esta reserva/i)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /como inquilino/i }))
    expect(await screen.findByText(/ya calificaste esta reserva/i)).toBeInTheDocument()

    expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1)
    expect(fetchMyUserRatingMock).toHaveBeenCalledWith('res-1')
  })

  it('falla la hidratación: hay reintento sin POST duplicado', async () => {
    fetchMyReservationsMock.mockResolvedValue([reservation()])
    fetchMyUserRatingMock.mockRejectedValueOnce(new Error('caída de red'))
    fetchMyUserRatingMock.mockResolvedValue({ rated: false, rating: null })
    const user = userEvent.setup()
    renderReservas()

    expect(await screen.findByText(/no pudimos verificar tu calificación/i)).toBeInTheDocument()

    // El reintento re-verifica antes de abrir: el POST sigue sin existir.
    await user.click(await screen.findByRole('button', { name: /^calificar/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(2)
    expect(submitUserRatingMock).not.toHaveBeenCalled()
  })

  it('tras hidratar no hay bucle de pedidos ante rerenders', async () => {    fetchMyReservationsMock.mockResolvedValue([reservation()])
    fetchMyUserRatingMock.mockResolvedValue({ rated: false, rating: null })
    const user = userEvent.setup()
    renderReservas()

    await user.click(await screen.findByRole('button', { name: /^calificar/i }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    // Cerrar el modal y navegar re-renderiza sin nuevos GET mine.
    await user.click(screen.getByRole('button', { name: /ahora no/i }))
    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    await user.click(screen.getByRole('tab', { name: /como inquilino/i }))

    expect(await screen.findByRole('button', { name: /^calificar/i })).toBeInTheDocument()
    expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1)
  })
})

describe('Dashboard — diálogo genérico anti doble-click', () => {
  it('un doble Confirmar emite un único PATCH', async () => {
    fetchReservationsAsOwnerMock.mockResolvedValue([
      reservation({ id: 'res-9', status: 'CONFIRMED', actualHandoffAt: null }),
    ])
    let resolveHandoff
    handoffReservationMock.mockImplementation(
      () => new Promise((resolve) => { resolveHandoff = resolve }),
    )
    const user = userEvent.setup()
    renderReservas()

    await user.click(await screen.findByRole('tab', { name: /como dueño/i }))
    await user.click(await screen.findByRole('button', { name: /marcar como entregado/i }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: /confirmar/i })
    await user.click(confirmButton)
    await user.click(screen.getByRole('button', { name: /procesando/i }))

    expect(handoffReservationMock).toHaveBeenCalledTimes(1)

    resolveHandoff({ id: 'res-9', status: 'CONFIRMED' })
    await waitFor(() => expect(handoffReservationMock).toHaveBeenCalledTimes(1))
  })
})
