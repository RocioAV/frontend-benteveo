import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from './api'
import {
  deleteProductPhoto,
  mapProduct,
  updateProduct,
  uploadProductPhotos,
} from './products.service'

vi.mock('./api', () => ({
  default: vi.fn(),
}))

beforeEach(() => {
  apiClient.mockReset()
})

describe('updateProduct', () => {
  it('envía los cambios mediante PATCH al producto indicado', async () => {
    const data = {
      title: 'Taladro actualizado',
      priceDay: 8500,
    }

    apiClient.mockResolvedValue({ id: 'product-1', ...data })

    await updateProduct('product-1', data)

    expect(apiClient).toHaveBeenCalledWith('/products/product-1', {
      method: 'PATCH',
      body: data,
    })
  })
})

describe('mapProduct', () => {
  it('conserva los datos necesarios para administrar las fotos', () => {
    const product = mapProduct({
      id: 'product-1',
      photos: [
        {
          id: 'photo-1',
          url: 'https://example.com/photo.jpg',
          publicId: 'benteveo/products/product-1/photo-1',
        },
      ],
    })

    expect(product.photos).toEqual([
      {
        id: 'photo-1',
        url: 'https://example.com/photo.jpg',
        publicId: 'benteveo/products/product-1/photo-1',
      },
    ])
    expect(product.images).toEqual(['https://example.com/photo.jpg'])
  })
})

describe('deleteProductPhoto', () => {
  it('elimina una foto usando su publicId codificado', async () => {
    const publicId = 'benteveo/products/product-1/photo-1'
    apiClient.mockResolvedValue({ message: 'Foto eliminada correctamente' })

    await deleteProductPhoto(publicId)

    expect(apiClient).toHaveBeenCalledWith(
      `/products/photos?publicId=${encodeURIComponent(publicId)}`,
      { method: 'DELETE' },
    )
  })
})

describe('uploadProductPhotos', () => {
  it('envía todas las fotos en un único pedido multipart', async () => {
    const files = [
      new File(['uno'], 'uno.jpg', { type: 'image/jpeg' }),
      new File(['dos'], 'dos.webp', { type: 'image/webp' }),
    ]
    const appendSpy = vi.spyOn(FormData.prototype, 'append')

    try {
      apiClient.mockResolvedValue([])

      await uploadProductPhotos('product-1', files)

      expect(apiClient).toHaveBeenCalledWith('/products/product-1/photos', {
        method: 'POST',
        body: expect.any(FormData),
      })
      expect(appendSpy).toHaveBeenNthCalledWith(1, 'photos', files[0])
      expect(appendSpy).toHaveBeenNthCalledWith(2, 'photos', files[1])
    } finally {
      appendSpy.mockRestore()
    }
  })
})
