import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import Dashboard from './Dashboard.jsx'

const mocks = vi.hoisted(() => ({
  fetchProducts: vi.fn(),
  fetchFavorites: vi.fn(),
  fetchMyReservations: vi.fn(),
  fetchReservationsAsOwner: vi.fn(),
  fetchInquiries: vi.fn(),
  useAuth: vi.fn(),
  useFavorites: vi.fn(),
}))

vi.mock('../services/products.service.js', () => ({
  fetchProducts: mocks.fetchProducts,
  fetchPublicProfile: vi.fn().mockResolvedValue(null),
  deleteProduct: vi.fn(),
  toggleAvailability: vi.fn(),
}))

vi.mock('../services/favorites.service.js', () => ({
  fetchFavorites: mocks.fetchFavorites,
}))

vi.mock('../services/reservations.service.js', () => ({
  fetchMyReservations: mocks.fetchMyReservations,
  fetchReservationsAsOwner: mocks.fetchReservationsAsOwner,
  cancelReservation: vi.fn(),
  handoffReservation: vi.fn(),
  confirmHandoffReceipt: vi.fn(),
  returnReservation: vi.fn(),
  confirmReturnReceipt: vi.fn(),
}))

vi.mock('../services/inquiries.service.js', () => ({
  fetchInquiries: mocks.fetchInquiries,
}))

vi.mock('../services/user-ratings.service.js', () => ({
  fetchMyUserRating: vi.fn().mockResolvedValue({ rated: false }),
  submitUserRating: vi.fn(),
}))

vi.mock('../services/profile.service.js', () => ({
  uploadAvatar: vi.fn(),
  updateProfile: vi.fn(),
}))

vi.mock('../components/modals/reservationDetail.map.js', () => ({
  fetchReservationDetail: vi.fn(),
}))

vi.mock('../context/useAuth', () => ({
  useAuth: mocks.useAuth,
}))

vi.mock('../context/useFavorites', () => ({
  useFavorites: mocks.useFavorites,
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

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
}

beforeEach(() => {
  mocks.fetchProducts.mockReset().mockResolvedValue([])
  mocks.fetchFavorites.mockReset().mockResolvedValue([])
  mocks.fetchMyReservations.mockReset().mockResolvedValue([
    {
      id: 'reservation-1',
      status: 'CONFIRMED',
      createdAt: '2026-10-03T10:00:00.000Z',
      dateInit: '2026-12-10T12:00:00.000Z',
      dateEnd: '2026-12-12T12:00:00.000Z',
      product: { id: 'product-1', title: 'Taladro', pricePerDay: 5000, imageUrl: null },
    },
  ])
  mocks.fetchReservationsAsOwner.mockReset().mockResolvedValue([])
  mocks.fetchInquiries.mockReset().mockResolvedValue([
    {
      id: 'inquiry-1',
      createdAt: '2026-10-04T10:00:00.000Z',
      requesterId: 'requester-1',
      product: { id: 'product-2', title: 'Sierra circular', ownerId: 'user-1' },
      requester: { id: 'requester-1', name: 'Ana Inquilina' },
    },
  ])
  mocks.useAuth.mockReturnValue({
    user: { id: 'user-1', name: 'Dueño Uno', email: 'dueno@example.com' },
    userId: 'user-1',
    logout: vi.fn(),
    refreshUser: vi.fn(),
  })
  mocks.useFavorites.mockReturnValue({ favoriteIds: [], isFavorite: () => false })
})

describe('Dashboard — consultas entrantes', () => {
  it('combina reservas y consultas, identifica la entrante y abre su chat', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/dashboard?tab=conversaciones']}>
        <Dashboard />
        <LocationProbe />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Conversaciones' })).toBeInTheDocument()
    expect(await screen.findByText('Consulta entrante · Pre-alquiler')).toBeInTheDocument()
    expect(screen.getByText('Sierra circular')).toBeInTheDocument()
    expect(screen.getByText('Taladro')).toBeInTheDocument()
    expect(mocks.fetchInquiries).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /consulta entrante.*ana inquilina.*sierra circular/i }))

    expect(screen.getByTestId('location')).toHaveTextContent('/chat/inquiry/inquiry-1')
  })
})
