import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from './api'
import { updateProduct } from './products.service'

vi.mock('./api', () => ({
  default: vi.fn(),
}))

describe('updateProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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