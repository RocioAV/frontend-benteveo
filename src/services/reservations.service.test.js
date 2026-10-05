import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from './api'
import {
  cancelReservation,
  confirmHandoffReceipt,
  confirmReturnReceipt,
  fetchMyReservations,
  fetchReservation,
  fetchReservationsAsOwner,
  handoffReservation,
  returnReservation,
} from './reservations.service'

vi.mock('./api', () => ({
  default: vi.fn(),
}))

beforeEach(() => {
  apiClient.mockReset()
})

describe('flujo bilateral de reservas', () => {
  it('el dueño marca la entrega sin cambiar el estado desde el frontend', async () => {
    apiClient.mockResolvedValue({ id: 'res-1', status: 'CONFIRMED' })

    await handoffReservation('res-1')

    expect(apiClient).toHaveBeenCalledWith('/reservations/res-1/handoff', {
      method: 'PATCH',
    })
  })

  it('el inquilino confirma la recepción hacia ACTIVE', async () => {
    apiClient.mockResolvedValue({ id: 'res-1', status: 'ACTIVE' })

    await confirmHandoffReceipt('res-1')

    expect(apiClient).toHaveBeenCalledWith('/reservations/res-1/handoff/confirm', {
      method: 'PATCH',
    })
  })

  it('el inquilino marca la devolución sin cambiar el estado desde el frontend', async () => {
    apiClient.mockResolvedValue({ id: 'res-1', status: 'ACTIVE' })

    await returnReservation('res-1')

    expect(apiClient).toHaveBeenCalledWith('/reservations/res-1/return', {
      method: 'PATCH',
    })
  })

  it('el dueño confirma la recepción final hacia COMPLETED', async () => {
    apiClient.mockResolvedValue({ id: 'res-1', status: 'COMPLETED' })

    await confirmReturnReceipt('res-1')

    expect(apiClient).toHaveBeenCalledWith('/reservations/res-1/return/confirm', {
      method: 'PATCH',
    })
  })

  it('no expone la ruta inexistente de confirmación manual (PENDING → CONFIRMED)', async () => {
    const { confirmReservation } = await import('./reservations.service')

    expect(confirmReservation).toBeUndefined()
    expect(apiClient).not.toHaveBeenCalledWith(
      '/reservations/res-1/confirm',
      expect.anything(),
    )
  })
})

describe('lectura de reservas', () => {
  it('normaliza el producto de mis reservas como inquilino', async () => {
    apiClient.mockResolvedValue([
      { id: 'res-1', product: { id: 'prod-1', priceDay: 1000, photos: [] } },
    ])

    const list = await fetchMyReservations()

    expect(list).toHaveLength(1)
    expect(list[0].product.pricePerDay).toBe(1000)
  })

  it('normaliza el producto de las reservas como dueño', async () => {
    apiClient.mockResolvedValue([
      { id: 'res-2', product: { id: 'prod-2', priceDay: 2000, photos: [] } },
    ])

    const list = await fetchReservationsAsOwner()

    expect(list).toHaveLength(1)
    expect(list[0].product.pricePerDay).toBe(2000)
  })

  it('deriva imageUrl de la primera foto del producto', async () => {
    apiClient.mockResolvedValue([
      {
        id: 'res-1',
        product: {
          id: 'prod-1',
          priceDay: 1000,
          photos: [
            { id: 'photo-1', url: 'https://example.com/1.jpg', publicId: 'a' },
            { id: 'photo-2', url: 'https://example.com/2.jpg', publicId: 'b' },
          ],
        },
      },
    ])

    const list = await fetchMyReservations()

    expect(list[0].product.imageUrl).toBe('https://example.com/1.jpg')
  })

  it('deja imageUrl en null sin fotos para que el placeholder siga funcionando', async () => {
    apiClient.mockResolvedValue([
      { id: 'res-1', product: { id: 'prod-1', priceDay: 1000, photos: [] } },
    ])

    const list = await fetchMyReservations()

    expect(list[0].product.imageUrl).toBeNull()
  })

  it('cancela mediante PATCH y obtiene el detalle normalizado', async () => {
    apiClient.mockResolvedValue({ id: 'res-1' })
    await cancelReservation('res-1')
    expect(apiClient).toHaveBeenCalledWith('/reservations/res-1/cancel', {
      method: 'PATCH',
    })

    apiClient.mockResolvedValue({ id: 'res-1', product: null })
    const detail = await fetchReservation('res-1')
    expect(detail).toMatchObject({ id: 'res-1', product: null })
  })
})
