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
const { fetchProductsMock } = vi.hoisted(() => ({
  fetchProductsMock: vi.fn(),
}))

vi.mock('../services/products.service.js', () => ({
  fetchProducts: fetchProductsMock,
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
})
