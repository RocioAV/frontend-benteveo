import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EditarPublicacion from './EditarPublicacion.jsx'
import userEvent from '@testing-library/user-event'

const { fetchProductMock, updateProductMock, fetchLocalitiesMock } = vi.hoisted(() => ({
  fetchProductMock: vi.fn(),
  updateProductMock: vi.fn(),
  fetchLocalitiesMock: vi.fn(),
}))
vi.mock('../services/locations.service.js', () => ({
  provincias: [
    { id: '02', nombre: 'Ciudad Autonoma de Buenos Aires'},
    { id: '06', nombre: 'Buenos Aires'},
  ],
  fetchLocalitiesByProvince: fetchLocalitiesMock,
}))


vi.mock('../services/products.service.js', () => ({
  fetchProduct: fetchProductMock,
  updateProduct: updateProductMock,
}))

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => ({
    userId: 'owner-1',
  }),
}))

describe('EditarPublicacion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchLocalitiesMock.mockResolvedValue(['La Plata'])
  })

  it('carga el producto y completa sus campos editables', async () => {
    const user = userEvent.setup()
    fetchProductMock.mockResolvedValue({
      id: 'product-1',
      ownerId: 'owner-1',
      title: 'Taladro actual',
      description: 'Taladro con accesorios',
      pricePerDay: 8500,
      priceMonth: 90000,
      deposit: 25000,
      category: 'Herramientas',
      state: 'Buenos Aires',
      city: 'La Plata',
      address: 'Calle 10 123',
      isAvailable: true,
    })

    render(
      <MemoryRouter initialEntries={['/publicaciones/product-1/editar']}>
        <Routes>
          <Route
            path="/publicaciones/:id/editar"
            element={<EditarPublicacion />}
          />
          <Route
            path="/dashboard"
            element={<p>Destino: Mis publicaciones</p>}
          />
        </Routes>
      </MemoryRouter>,
    )

    const titleInput = await screen.findByRole('textbox', {
      name: /título/i,
    })

    expect(titleInput).toHaveValue('Taladro actual')

    await user.clear(titleInput)
    await user.type(titleInput, 'Taladro actualizado')

    expect(titleInput).toHaveValue('Taladro actualizado')

    expect(screen.getByRole('textbox', { name: /descripción/i }))
      .toHaveValue('Taladro con accesorios')
    expect(screen.getByRole('spinbutton', { name: /precio por día/i }))
      .toHaveValue(8500)
    expect(screen.getByRole('spinbutton', { name: /precio por mes/i }))
      .toHaveValue(90000)
    expect(screen.getByRole('spinbutton', { name: /depósito/i }))
      .toHaveValue(25000)
    expect(screen.getByRole('combobox', { name: /categoría/i }))
      .toHaveValue('Herramientas')
    expect(screen.getByRole('combobox', { name: /provincia/i }))
      .toHaveValue('Buenos Aires')
    expect(screen.getByRole('combobox', { name: /localidad/i }))
      .toHaveValue('La Plata')
    expect(screen.getByRole('textbox', { name: /dirección/i }))
      .toHaveValue('Calle 10 123')
    expect(screen.getByRole('checkbox', { name: /disponible/i }))
      .toBeChecked()
    const saveButton = screen.getByRole('button', {
      name: /guardar cambios/i,
    })

    await user.click(saveButton)

    expect(updateProductMock).toHaveBeenCalledWith('product-1', {
      title: 'Taladro actualizado',
      descripcion: 'Taladro con accesorios',
      priceDay: 8500,
      priceMonth: 90000,
      deposit: 25000,
      category: 'Herramientas',
      state: 'Buenos Aires',
      city: 'La Plata',
      address: 'Calle 10 123',
      zone: 'AMBA',
      isAvailable: true,
    })

    expect(
      await screen.findByText('Destino: Mis publicaciones'),
    ).toBeInTheDocument()

    expect(fetchProductMock).toHaveBeenCalledWith('product-1')
  })
})
