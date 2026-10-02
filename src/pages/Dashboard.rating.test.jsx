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

function renderAgenda() {
  useAuthMock.mockReturnValue({
    user: { id: 'user-1', name: 'Dueño Uno', email: 'dueno@example.com' },
    userId: 'user-1',
    logout: vi.fn(),
    refreshUser: vi.fn(),
  })
  return render(
    <MemoryRouter initialEntries={['/dashboard?tab=agenda']}>
      <Dashboard />
    </MemoryRouter>,
  )
}

describe('Dashboard — hidratación del estado de calificación', () => {
  it('Mis reservas con rated:true nunca muestra `Calificar` ni `Verificando`: solo `Ya calificaste`', async () => {
    fetchMyReservationsMock.mockResolvedValue([reservation()])
    let resolveMine
    fetchMyUserRatingMock.mockImplementation(
      () => new Promise((resolve) => { resolveMine = resolve }),
    )
    renderReservas()

    // Mientras hidrata, Mis reservas (seguimiento) no muestra nada interactivo.
    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /verificando/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    await waitFor(() => expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1))

    resolveMine({ rated: true, rating: { id: 'rating-1', score: 5 } })

    expect(await screen.findByText(/ya calificaste esta reserva \(5\/5\)/i)).toBeInTheDocument()
    // Sin clic del usuario: el modal nunca aparece y no hay POST posible.
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /verificando/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1)
    expect(submitUserRatingMock).not.toHaveBeenCalled()
  })

  it('Mis reservas con rated:false no muestra `Calificar`; Agenda sí lo ofrece sin re-verificar', async () => {
    fetchMyReservationsMock.mockResolvedValue([reservation()])
    let resolveMine
    fetchMyUserRatingMock.mockImplementation(
      () => new Promise((resolve) => { resolveMine = resolve }),
    )
    const user = userEvent.setup()
    renderReservas()

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    await waitFor(() => expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1))

    resolveMine({ rated: false, rating: null })

    // Mis reservas (seguimiento) jamás ofrece Calificar aunque esté sin calificar.
    await waitFor(() => expect(screen.queryByText('Taladro')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /verificando/i })).not.toBeInTheDocument()

    // Agenda conserva la acción: abre directo sin otro GET mine.
    await user.click(screen.getByRole('button', { name: /^agenda$/i }))
    await user.click(await screen.findByRole('button', { name: /^calificar/i }))

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

  it('falla la hidratación: Mis reservas no reintenta; Agenda sí sin POST duplicado', async () => {
    fetchMyReservationsMock.mockResolvedValue([reservation()])
    fetchMyUserRatingMock.mockRejectedValueOnce(new Error('caída de red'))
    fetchMyUserRatingMock.mockResolvedValue({ rated: false, rating: null })
    const user = userEvent.setup()
    renderReservas()

    // Mis reservas (seguimiento) no muestra reintento interactivo.
    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    await waitFor(() => expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/no pudimos verificar tu calificación/i)).not.toBeInTheDocument()

    // Agenda conserva el reintento: re-verifica antes de abrir, sin POST.
    await user.click(screen.getByRole('button', { name: /^agenda$/i }))
    expect(await screen.findByText(/no pudimos verificar tu calificación/i)).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /^calificar/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(2)
    expect(submitUserRatingMock).not.toHaveBeenCalled()
  })

  it('tras hidratar no hay bucle de pedidos ante rerenders (Agenda conserva Calificar)', async () => {
    fetchMyReservationsMock.mockResolvedValue([reservation()])
    fetchMyUserRatingMock.mockResolvedValue({ rated: false, rating: null })
    const user = userEvent.setup()
    renderReservas()

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    await waitFor(() => expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1))
    // Mis reservas nunca ofrece Calificar.
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^agenda$/i }))
    await user.click(await screen.findByRole('button', { name: /^calificar/i }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    // Cerrar el modal y volver re-renderiza sin nuevos GET mine.
    await user.click(screen.getByRole('button', { name: /ahora no/i }))
    await user.click(screen.getByRole('button', { name: /^mis reservas$/i }))

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    expect(fetchMyUserRatingMock).toHaveBeenCalledTimes(1)
  })
})

describe('Dashboard — diálogo genérico anti doble-click', () => {
  it('un doble Confirmar desde Agenda emite un único PATCH', async () => {
    fetchReservationsAsOwnerMock.mockResolvedValue([
      reservation({ id: 'res-9', status: 'CONFIRMED', actualHandoffAt: null }),
    ])
    let resolveHandoff
    handoffReservationMock.mockImplementation(
      () => new Promise((resolve) => { resolveHandoff = resolve }),
    )
    const user = userEvent.setup()
    renderAgenda()

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

  it('Mis reservas accionable no ofrece Marcar como entregado (vive en Agenda)', async () => {
    fetchReservationsAsOwnerMock.mockResolvedValue([
      reservation({ id: 'res-9', status: 'CONFIRMED', actualHandoffAt: null }),
    ])
    const user = userEvent.setup()
    renderReservas()

    await user.click(await screen.findByRole('tab', { name: /como dueño/i }))
    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como entregado/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(handoffReservationMock).not.toHaveBeenCalled()
  })
})
