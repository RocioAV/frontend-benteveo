import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DetalleProducto from './DetalleProducto.jsx'

const {
  fetchProductMock,
  fetchProductsMock,
  fetchPublicProfileMock,
} = vi.hoisted(() => ({
  fetchProductMock: vi.fn(),
  fetchProductsMock: vi.fn(),
  fetchPublicProfileMock: vi.fn(),
}))

vi.mock('../services/products.service.js', () => ({
  fetchProduct: fetchProductMock,
  fetchProducts: fetchProductsMock,
  fetchPublicProfile: fetchPublicProfileMock,
}))

vi.mock('../context/useFavorites', () => ({
  useFavorites: () => ({ isFavorite: () => false, toggleFavorite: vi.fn() }),
}))

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ status: 'anon', user: null, userId: null }),
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

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/detalle/prod-1']}>
      <Routes>
        <Route path="/detalle/:id" element={<DetalleProducto />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DetalleProducto — calificación del dueño', () => {
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
})
