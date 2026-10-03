import { describe, expect, it } from 'vitest'
import { mapReservationToDetail } from './reservationDetail.map'

describe('mapReservationToDetail — flujo bilateral', () => {
  it('propaga los timestamps para derivar la acción visible', () => {
    const detail = mapReservationToDetail(
      {
        id: 'res-1',
        status: 'CONFIRMED',
        dateInit: '2026-12-10T12:00:00.000Z',
        dateEnd: '2026-12-12T12:00:00.000Z',
        actualHandoffAt: '2026-09-30T10:00:00.000Z',
        renterReceivedAt: null,
        renterReturnedAt: null,
        actualReturnAt: null,
        product: { title: 'Taladro', priceDay: 5000 },
      },
      { statusLabels: { CONFIRMED: 'Confirmada' } },
    )

    expect(detail).toMatchObject({
      statusCode: 'CONFIRMED',
      actualHandoffAt: '2026-09-30T10:00:00.000Z',
      renterReceivedAt: null,
      renterReturnedAt: null,
      actualReturnAt: null,
    })
  })

  it('normaliza timestamps ausentes a null', () => {
    const detail = mapReservationToDetail(
      {
        id: 'res-1',
        status: 'ACTIVE',
        dateInit: '2026-12-10T12:00:00.000Z',
        dateEnd: '2026-12-12T12:00:00.000Z',
        product: {},
      },
      {},
    )

    expect(detail).toMatchObject({
      actualHandoffAt: null,
      renterReceivedAt: null,
      renterReturnedAt: null,
      actualReturnAt: null,
    })
  })

  it('calcula 9 días para una reserva del 1 al 10 de octubre (igual que el backend)', () => {
    const detail = mapReservationToDetail(
      {
        id: 'res-9',
        status: 'CONFIRMED',
        dateInit: '2026-10-01T12:00:00.000Z',
        dateEnd: '2026-10-10T12:00:00.000Z',
        product: { title: 'Taladro' },
      },
      {},
    )

    expect(detail.duration).toBe('9 días de alquiler')
  })

  it('usa el singular para una reserva válida de un día', () => {
    const detail = mapReservationToDetail(
      {
        id: 'res-1d',
        status: 'CONFIRMED',
        dateInit: '2026-10-01T12:00:00.000Z',
        dateEnd: '2026-10-02T12:00:00.000Z',
        product: { title: 'Taladro' },
      },
      {},
    )

    expect(detail.duration).toBe('1 día de alquiler')
  })
})
