import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from './api'
import {
  createInquiry,
  fetchInquiry,
  fetchInquiryMessages,
  fetchInquiries,
} from './inquiries.service.js'

vi.mock('./api', () => ({
  default: vi.fn(),
}))

beforeEach(() => {
  apiClient.mockReset()
})

describe('inquiries.service', () => {
  it('creates or reuses an inquiry for a product', async () => {
    apiClient.mockResolvedValue({ id: 'inquiry-1' })

    await createInquiry('product-1')

    expect(apiClient).toHaveBeenCalledWith('/inquiries', {
      method: 'POST',
      body: { productId: 'product-1' },
    })
  })

  it('normalizes the inquiry list response', async () => {
    apiClient.mockResolvedValue([{ id: 'inquiry-1' }])

    await expect(fetchInquiries()).resolves.toEqual([{ id: 'inquiry-1' }])
    expect(apiClient).toHaveBeenCalledWith('/inquiries')
  })

  it('loads inquiry details and history through their authenticated REST endpoints', async () => {
    apiClient
      .mockResolvedValueOnce({ id: 'inquiry-1', productId: 'product-1' })
      .mockResolvedValueOnce({ messages: [{ id: 'message-1' }] })

    await expect(fetchInquiry('inquiry-1')).resolves.toEqual({
      id: 'inquiry-1',
      productId: 'product-1',
    })
    await expect(fetchInquiryMessages('inquiry-1')).resolves.toEqual([{ id: 'message-1' }])

    expect(apiClient).toHaveBeenNthCalledWith(1, '/inquiries/inquiry-1')
    expect(apiClient).toHaveBeenNthCalledWith(2, '/inquiries/inquiry-1/messages')
  })

  it('keeps history best-effort when the REST request fails', async () => {
    apiClient.mockRejectedValue(new Error('network'))

    await expect(fetchInquiryMessages('inquiry-1')).resolves.toEqual([])
  })
})
