import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PageCatalogo from './PageCatalogo.jsx'
import products from '../data/products.json'

// Mock del contexto del Layout (Header provee query/onSearch vía Outlet)
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useOutletContext: () => ({ query: '', onSearch: vi.fn() }),
  }
})

// Mock de ProductCard para aislar la lógica de filtro/paginación (evita motion/Link)
vi.mock('../components/ProductCard/ProductCard.jsx', () => ({
  default: ({ product }) => <article data-testid="product-card">{product.title}</article>,
}))

// Mock del servicio: PageCatalogo ahora carga productos de forma async.
const { fetchProductsMock, useLocationMock } = vi.hoisted(() => ({
  fetchProductsMock: vi.fn(),
  useLocationMock: vi.fn(),
}))

vi.mock('../services/products.service.js', () => ({
  fetchProducts: fetchProductsMock,
}))

vi.mock('../context/LocationContext.jsx', () => ({
  useLocation: useLocationMock,
}))

function renderCatalogo() {
  return render(
    <MemoryRouter>
      <PageCatalogo />
    </MemoryRouter>
  )
}

describe('PageCatalogo', () => {
  beforeEach(() => {
    fetchProductsMock.mockResolvedValue(products)
    useLocationMock.mockReset()
    useLocationMock.mockReturnValue({ status: 'idle', position: null })
  })

  it('muestra el contador y 12 cards en la primera página', async () => {
    renderCatalogo()
    expect(await screen.findByText(/productos disponibles/)).toBeInTheDocument()
    expect(screen.getAllByTestId('product-card')).toHaveLength(12)
  })

  it('filtra por categoría al clickear', async () => {
    const user = userEvent.setup()
    renderCatalogo()
    await screen.findByText(/productos disponibles/)
    await user.click(screen.getByRole('button', { name: /jardinería/i }))
    expect(await screen.findByText(/en jardinería/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('product-card')).toHaveLength(10)
  })

  it('renderiza la paginación con 7 páginas', async () => {
    renderCatalogo()
    await screen.findByText(/productos disponibles/)
    expect(screen.getByRole('navigation', { name: /paginación/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument()
  })

  it('cambia de página al clickear el número', async () => {
    const user = userEvent.setup()
    renderCatalogo()
    await screen.findByText(/productos disponibles/)
    await user.click(screen.getByRole('button', { name: '2' }))
    expect(screen.getByRole('button', { name: '2', current: 'page' })).toBeInTheDocument()
  })

  it('confirma la ubicación real y oculta el banner de activación', async () => {
    useLocationMock.mockReturnValue({
      status: 'active',
      position: {
        coords: {
          latitude: -34.60372,
          longitude: -58.38159,
        },
      },
    })

    renderCatalogo()

    expect(await screen.findByText('Tu ubicación es -34.60372, -58.38159')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ubicación activa' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver estado' })).not.toBeInTheDocument()
  })

  it('mantiene el flujo demo sin inventar coordenadas', async () => {
    useLocationMock.mockReturnValue({ status: 'demo', position: null })

    renderCatalogo()

    expect(await screen.findByRole('heading', { name: 'Zona de referencia activa' })).toBeInTheDocument()
    expect(screen.queryByText(/Tu ubicación es/)).not.toBeInTheDocument()
  })
})
