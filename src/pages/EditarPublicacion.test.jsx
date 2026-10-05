import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EditarPublicacion from './EditarPublicacion.jsx'

const {
  deleteProductPhotoMock,
  fetchProductMock,
  updateProductMock,
  uploadProductPhotosMock,
  fetchLocalitiesMock,
} = vi.hoisted(() => ({
  deleteProductPhotoMock: vi.fn(),
  fetchProductMock: vi.fn(),
  updateProductMock: vi.fn(),
  uploadProductPhotosMock: vi.fn(),
  fetchLocalitiesMock: vi.fn(),
}))
vi.mock('../services/locations.service.js', () => ({
  provincias: [
    { id: '02', nombre: 'Ciudad Autonoma de Buenos Aires' },
    { id: '06', nombre: 'Buenos Aires' },
  ],
  fetchLocalitiesByProvince: fetchLocalitiesMock,
}))

vi.mock('../services/products.service.js', () => ({
  deleteProductPhoto: deleteProductPhotoMock,
  fetchProduct: fetchProductMock,
  updateProduct: updateProductMock,
  uploadProductPhotos: uploadProductPhotosMock,
}))

vi.mock('../context/useAuth.js', () => ({
  useAuth: () => ({ userId: 'owner-1' }),
}))

describe('EditarPublicacion', () => {
  const product = {
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
    photos: [
      {
        id: 'photo-1',
        url: 'https://example.com/taladro.jpg',
        publicId: 'benteveo/products/product-1/photo-1',
      },
    ],
    isAvailable: true,
  }

  const renderPage = () => render(
    <MemoryRouter initialEntries={['/publicaciones/product-1/editar']}>
      <Routes>
        <Route path="/publicaciones/:id/editar" element={<EditarPublicacion />} />
        <Route path="/dashboard" element={<p>Destino: Mis publicaciones</p>} />
      </Routes>
    </MemoryRouter>,
  )

  beforeEach(() => {
    deleteProductPhotoMock.mockReset()
    fetchProductMock.mockReset()
    updateProductMock.mockReset()
    uploadProductPhotosMock.mockReset()
    fetchLocalitiesMock.mockReset()
    fetchProductMock.mockResolvedValue(product)
    updateProductMock.mockResolvedValue(product)
    uploadProductPhotosMock.mockResolvedValue([])
    deleteProductPhotoMock.mockResolvedValue(null)
    fetchLocalitiesMock.mockResolvedValue(['La Plata'])
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((file) => `blob:${file.name}`),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('carga el producto y completa sus campos editables', async () => {
    const user = userEvent.setup()

    let resolveUpdate

    updateProductMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve
        }),
    )

    renderPage()

    const titleInput = await screen.findByRole('textbox', { name: /título/i })

    expect(titleInput).toHaveValue('Taladro actual')

    await user.clear(titleInput)
    await user.type(titleInput, 'Taladro actualizado')

    expect(titleInput).toHaveValue('Taladro actualizado')

    expect(screen.getByRole('textbox', { name: /descripción/i })).toHaveValue('Taladro con accesorios')
    expect(screen.getByRole('spinbutton', { name: /precio por día/i })).toHaveValue(8500)
    expect(screen.getByRole('spinbutton', { name: /precio por mes/i })).toHaveValue(90000)
    expect(screen.getByRole('spinbutton', { name: /depósito/i })).toHaveValue(25000)
    expect(screen.getByRole('combobox', { name: /categoría/i })).toHaveValue('Herramientas')
    expect(screen.getByRole('combobox', { name: /provincia/i })).toHaveValue('Buenos Aires')
    expect(screen.getByRole('combobox', { name: /localidad/i })).toHaveValue('La Plata')
    expect(screen.getByRole('textbox', { name: /dirección/i })).toHaveValue('Calle 10 123')
    expect(screen.getByRole('checkbox', { name: /disponible/i })).toBeChecked()
    const saveButton = screen.getByRole('button', { name: /guardar cambios/i })

    await user.click(saveButton)

    expect(saveButton).toBeDisabled()
    expect(saveButton).toHaveTextContent('Guardando...')

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
    expect(uploadProductPhotosMock).not.toHaveBeenCalled()
    expect(deleteProductPhotoMock).not.toHaveBeenCalled()

    resolveUpdate()

    expect(await screen.findByText('Destino: Mis publicaciones')).toBeInTheDocument()

    expect(fetchProductMock).toHaveBeenCalledWith('product-1')
  })

  it('muestra las imágenes actuales del producto', async () => {
    renderPage()

    expect(await screen.findByText('Fotos del producto (1/5)')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Foto 1 de Taladro actual' })).toHaveAttribute(
      'src',
      'https://example.com/taladro.jpg',
    )
  })

  it('permite agregar, previsualizar y quitar fotos nuevas', async () => {
    const user = userEvent.setup()
    const file = new File(['foto'], 'nueva.png', { type: 'image/png' })

    renderPage()

    const photoInput = await screen.findByLabelText('Agregar fotos')
    await user.upload(photoInput, file)

    expect(screen.getByRole('img', { name: 'Vista previa de nueva.png' })).toHaveAttribute(
      'src',
      'blob:nueva.png',
    )
    expect(screen.getByText('Fotos del producto (2/5)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Quitar foto nueva' }))

    expect(screen.queryByRole('img', { name: 'Vista previa de nueva.png' })).not.toBeInTheDocument()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:nueva.png')
  })

  it('rechaza una foto con un tipo MIME no permitido sin crear una vista previa', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const file = new File(['foto'], 'nueva.gif', { type: 'image/gif' })

    renderPage()

    await user.upload(await screen.findByLabelText('Agregar fotos'), file)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Las fotos deben ser archivos JPG, PNG o WEBP.',
    )
    expect(screen.queryByRole('img', { name: 'Vista previa de nueva.gif' })).not.toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('rechaza una foto mayor de 5 MB sin crear una vista previa', async () => {
    const user = userEvent.setup()
    const file = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      'grande.jpg',
      { type: 'image/jpeg' },
    )

    renderPage()

    await user.upload(await screen.findByLabelText('Agregar fotos'), file)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Cada foto debe pesar como máximo 5 MB.',
    )
    expect(screen.queryByRole('img', { name: 'Vista previa de grande.jpg' })).not.toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('marca y desmarca una foto existente sin llamar a la API', async () => {
    const user = userEvent.setup()

    renderPage()

    const deleteButton = await screen.findByRole('button', {
      name: 'Eliminar foto 1 de Taladro actual',
    })
    await user.click(deleteButton)

    expect(screen.getByText('Marcada para eliminar')).toBeInTheDocument()
    expect(screen.getByRole('button', {
      name: 'Conservar foto 1 de Taladro actual',
    })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(deleteProductPhotoMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', {
      name: 'Conservar foto 1 de Taladro actual',
    }))

    expect(screen.queryByText('Marcada para eliminar')).not.toBeInTheDocument()
    expect(deleteProductPhotoMock).not.toHaveBeenCalled()
  })

  it('bloquea el guardado si la publicación queda sin fotos', async () => {
    const user = userEvent.setup()

    renderPage()

    await user.click(await screen.findByRole('button', {
      name: 'Eliminar foto 1 de Taladro actual',
    }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'La publicación debe conservar entre 1 y 5 fotos.',
    )
    expect(updateProductMock).not.toHaveBeenCalled()
  })

  it('rechaza atómicamente un lote que superaría el máximo de cinco fotos', async () => {
    const user = userEvent.setup()
    const files = Array.from(
      { length: 5 },
      (_, index) => new File(['foto'], `nueva-${index}.jpg`, { type: 'image/jpeg' }),
    )

    renderPage()

    await user.upload(await screen.findByLabelText('Agregar fotos'), files)

    expect(screen.getByRole('alert')).toHaveTextContent('Podés conservar como máximo 5 fotos.')
    expect(screen.getByText('Fotos del producto (1/5)')).toBeInTheDocument()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('sube las fotos nuevas antes de eliminar las existentes y navega al finalizar', async () => {
    const user = userEvent.setup()
    const file = new File(['foto'], 'reemplazo.webp', { type: 'image/webp' })

    renderPage()

    await user.upload(await screen.findByLabelText('Agregar fotos'), file)
    await user.click(screen.getByRole('button', {
      name: 'Eliminar foto 1 de Taladro actual',
    }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(uploadProductPhotosMock).toHaveBeenCalledTimes(1)
    expect(uploadProductPhotosMock).toHaveBeenCalledWith('product-1', [file])
    expect(deleteProductPhotoMock).toHaveBeenCalledWith(
      'benteveo/products/product-1/photo-1',
    )
    expect(uploadProductPhotosMock.mock.invocationCallOrder[0]).toBeLessThan(
      deleteProductPhotoMock.mock.invocationCallOrder[0],
    )
    expect(await screen.findByText('Destino: Mis publicaciones')).toBeInTheDocument()
  })

  it('informa el guardado parcial y reconcilia las fotos si falla la carga', async () => {
    const user = userEvent.setup()
    const file = new File(['foto'], 'nueva.jpg', { type: 'image/jpeg' })
    const reconciledProduct = {
      ...product,
      photos: [
        {
          id: 'photo-2',
          url: 'https://example.com/reconciliada.jpg',
          publicId: 'benteveo/products/product-1/photo-2',
        },
      ],
    }
    fetchProductMock
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce(reconciledProduct)
    uploadProductPhotosMock.mockRejectedValue(new Error('Error al subir'))

    renderPage()

    const titleInput = await screen.findByRole('textbox', { name: /título/i })
    await user.clear(titleInput)
    await user.type(titleInput, 'Taladro con fotos nuevas')
    await user.upload(await screen.findByLabelText('Agregar fotos'), file)
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Algunos cambios se guardaron, pero no pudimos completar la actualización de las fotos.',
    )
    expect(updateProductMock).toHaveBeenCalledWith(
      'product-1',
      expect.objectContaining({ title: 'Taladro con fotos nuevas' }),
    )
    expect(screen.queryByText('Destino: Mis publicaciones')).not.toBeInTheDocument()
    expect(
      await screen.findByRole('img', { name: 'Foto 1 de Taladro con fotos nuevas' }),
    ).toHaveAttribute('src', 'https://example.com/reconciliada.jpg')
    expect(fetchProductMock).toHaveBeenCalledTimes(2)
    expect(deleteProductPhotoMock).not.toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:nueva.jpg')
  })

  it('informa el guardado parcial y reconcilia las fotos si falla una eliminación', async () => {
    const user = userEvent.setup()
    const productWithTwoPhotos = {
      ...product,
      photos: [
        ...product.photos,
        {
          id: 'photo-2',
          url: 'https://example.com/accesorios.jpg',
          publicId: 'benteveo/products/product-1/photo-2',
        },
      ],
    }
    const reconciledProduct = {
      ...product,
      photos: [
        {
          id: 'photo-2',
          url: 'https://example.com/reconciliada.jpg',
          publicId: 'benteveo/products/product-1/photo-2',
        },
      ],
    }
    fetchProductMock
      .mockResolvedValueOnce(productWithTwoPhotos)
      .mockResolvedValueOnce(reconciledProduct)
    deleteProductPhotoMock.mockRejectedValue(new Error('Error al eliminar'))

    renderPage()

    await user.click(await screen.findByRole('button', {
      name: 'Eliminar foto 1 de Taladro actual',
    }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Algunos cambios se guardaron, pero no pudimos completar la actualización de las fotos.',
    )
    expect(updateProductMock).toHaveBeenCalledTimes(1)
    expect(uploadProductPhotosMock).not.toHaveBeenCalled()
    expect(deleteProductPhotoMock).toHaveBeenCalledWith(
      'benteveo/products/product-1/photo-1',
    )
    expect(screen.queryByText('Destino: Mis publicaciones')).not.toBeInTheDocument()
    expect(
      await screen.findByRole('img', { name: 'Foto 1 de Taladro actual' }),
    ).toHaveAttribute('src', 'https://example.com/reconciliada.jpg')
    expect(fetchProductMock).toHaveBeenCalledTimes(2)
  })

  it('informa un estado incierto si también falla la reconciliación de fotos', async () => {
    const user = userEvent.setup()
    const file = new File(['foto'], 'nueva.jpg', { type: 'image/jpeg' })
    fetchProductMock
      .mockResolvedValueOnce(product)
      .mockRejectedValueOnce(new Error('Error al reconciliar'))
    uploadProductPhotosMock.mockRejectedValue(new Error('Error al subir'))

    renderPage()

    await user.upload(await screen.findByLabelText('Agregar fotos'), file)
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText(
      'Algunos cambios pueden haberse guardado, pero no pudimos actualizar el estado actual de las fotos.',
    )).toBeInTheDocument()
    expect(updateProductMock).toHaveBeenCalledTimes(1)
    expect(fetchProductMock).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('Destino: Mis publicaciones')).not.toBeInTheDocument()
  })

  it('muestra un mensaje si no puede guardar los cambios', async () => {
    const user = userEvent.setup()

    updateProductMock.mockRejectedValue(new Error('Error al guardar'))

    renderPage()

    const saveButton = await screen.findByRole('button', { name: /guardar cambios/i })

    await user.click(saveButton)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos guardar los cambios.',
    )
    expect(saveButton).not.toBeDisabled()
    expect(saveButton).toHaveTextContent('Guardar cambios')
    expect(fetchProductMock).toHaveBeenCalledTimes(2)
  })
})
