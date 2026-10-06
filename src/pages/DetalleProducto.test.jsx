import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DetalleProducto from './DetalleProducto.jsx'

const {
  fetchProductMock,
  fetchProductsMock,
  fetchPublicProfileMock,
  createInquiryMock,
  useAuthMock,
  useLocationMock,
} = vi.hoisted(() => ({
  fetchProductMock: vi.fn(),
  fetchProductsMock: vi.fn(),
  fetchPublicProfileMock: vi.fn(),
  createInquiryMock: vi.fn(),
  useAuthMock: vi.fn(),
  useLocationMock: vi.fn(),
}))

vi.mock('../services/products.service.js', () => ({
  fetchProduct: fetchProductMock,
  fetchProducts: fetchProductsMock,
  fetchPublicProfile: fetchPublicProfileMock,
}))

vi.mock('../services/inquiries.service.js', () => ({
  createInquiry: createInquiryMock,
}))

vi.mock('../context/useFavorites', () => ({
  useFavorites: () => ({ isFavorite: () => false, toggleFavorite: vi.fn() }),
}))

vi.mock('../context/useAuth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('../context/LocationContext.jsx', () => ({
  useLocation: useLocationMock,
}))

vi.mock('./Reservation.jsx', () => ({
  default: () => null,
}))

vi.mock('../components/ProductReviews/ProductReviews.jsx', () => ({
  default: () => null,
}))

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => tag,
    },
  ),
  MotionConfig: ({ children }) => children,
}))

function product() {
  return {
    id: 'prod-1',
    ownerId: 'owner-1',
    title: 'Taladro',
    description: 'Taladro en buen estado.',
    pricePerDay: 5000,
    category: 'Herramientas',
    region: 'La Plata',
    city: 'La Plata',
    deposit: 10000,
    imageUrl: null,
    images: [],
    isAvailable: true,
    rating: null,
    reviewCount: 0,
    completedRentals: 0,
  }
}

function renderDetail({ status = 'anon', userId = null } = {}) {
  useAuthMock.mockReturnValue({ status, user: null, userId })
  return render(
    <MemoryRouter initialEntries={['/detalle/prod-1']}>
      <Routes>
        <Route path="/detalle/:id" element={<DetalleProducto />} />
        <Route path="/chat/inquiry/:inquiryId" element={<div>Inquiry chat</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DetalleProducto — calificación del dueño', () => {
  beforeEach(() => {
    createInquiryMock.mockReset()
    useAuthMock.mockReset()
    useLocationMock.mockReset()
    useLocationMock.mockReturnValue({ status: 'idle' })
  })

  it('muestra el promedio y la cantidad de calificaciones del perfil público', async () => {
    fetchProductMock.mockResolvedValue(product())
    fetchProductsMock.mockResolvedValue([])
    fetchPublicProfileMock.mockResolvedValue({
      id: 'owner-1',
      name: 'Dueño Uno',
      avatar: null,
      isIdentityVerified: true,
      averageRating: 4.5,
      ratingCount: 2,
    })

    renderDetail()

    await waitFor(() => expect(fetchPublicProfileMock).toHaveBeenCalledWith('owner-1'))
    expect(await screen.findByText('Dueño Uno')).toBeInTheDocument()
    expect(screen.getByText(/4\.5/)).toBeInTheDocument()
    expect(screen.getByText(/\(2 calificaciones\)/)).toBeInTheDocument()
  })

  it('muestra un estado sin calificaciones en lugar de un 0', async () => {
    fetchProductMock.mockResolvedValue(product())
    fetchProductsMock.mockResolvedValue([])
    fetchPublicProfileMock.mockResolvedValue({
      id: 'owner-1',
      name: 'Dueño Uno',
      avatar: null,
      isIdentityVerified: false,
      averageRating: null,
      ratingCount: 0,
    })

    renderDetail()

    expect(
      await screen.findByText(/todavía no tiene calificaciones/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/\(0 calificaciones\)/)).not.toBeInTheDocument()
  })

  it('crea la consulta y abre el chat para un usuario autenticado', async () => {
    const user = userEvent.setup()
    fetchProductMock.mockResolvedValue(product())
    fetchProductsMock.mockResolvedValue([])
    fetchPublicProfileMock.mockResolvedValue({ name: 'Dueño Uno' })
    createInquiryMock.mockResolvedValue({ id: 'inquiry-1' })

    renderDetail({ status: 'authed', userId: 'renter-1' })

    await user.click(await screen.findByRole('button', { name: /^contactar$/i }))

    await waitFor(() => expect(createInquiryMock).toHaveBeenCalledWith('prod-1'))
    expect(await screen.findByText('Inquiry chat')).toBeInTheDocument()
  })

  it('muestra el error de creación sin perder el acceso a reintentar', async () => {
    const user = userEvent.setup()
    fetchProductMock.mockResolvedValue(product())
    fetchProductsMock.mockResolvedValue([])
    fetchPublicProfileMock.mockResolvedValue({ name: 'Dueño Uno' })
    createInquiryMock.mockRejectedValue(new Error('El producto ya no está disponible'))

    renderDetail({ status: 'authed', userId: 'renter-1' })

    await user.click(await screen.findByRole('button', { name: /^contactar$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El producto ya no está disponible')
    expect(screen.getByRole('button', { name: /^contactar$/i })).not.toBeDisabled()
  })

  it('no ofrece auto-contacto al dueño del producto', async () => {
    fetchProductMock.mockResolvedValue(product())
    fetchProductsMock.mockResolvedValue([])
    fetchPublicProfileMock.mockResolvedValue({ name: 'Dueño Uno' })

    renderDetail({ status: 'authed', userId: 'owner-1' })

    expect(await screen.findByText('Tu publicación')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^contactar$/i })).not.toBeInTheDocument()
    expect(createInquiryMock).not.toHaveBeenCalled()
  })

  it('muestra una etiqueta neutral para la distancia del fallback', async () => {
    fetchProductMock.mockResolvedValue({ ...product(), distance: '0.8 km' })
    fetchProductsMock.mockResolvedValue([])
    fetchPublicProfileMock.mockResolvedValue({ name: 'Dueño Uno' })

    renderDetail()

    expect(
      await screen.findByText(/Distancia: 0,8 km · Radio: 1 km \(10 cuadras\)/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/distancia estimada/i)).not.toBeInTheDocument()
  })
})
