import { describe, expect, it } from 'vitest'
import { getReservationStep, getRatingView, mergeReservationUpdate, selectAgendaReservations } from './reservation-actions'

function reservation(overrides = {}) {
  return {
    id: 'res-1',
    status: 'CONFIRMED',
    actualHandoffAt: null,
    renterReceivedAt: null,
    renterReturnedAt: null,
    actualReturnAt: null,
    ...overrides,
  }
}

describe('getReservationStep — flujo del dueño', () => {
  it('CONFIRMED sin entrega: puede marcar como entregado', () => {
    expect(getReservationStep(reservation(), 'owner')).toEqual({
      kind: 'action',
      key: 'handoff',
      label: 'Marcar como entregado',
    })
  })

  it('CONFIRMED con entrega: espera la recepción del inquilino', () => {
    const step = getReservationStep(
      reservation({ actualHandoffAt: '2026-09-30T10:00:00.000Z' }),
      'owner',
    )
    expect(step.kind).toBe('wait')
  })

  it('ACTIVE sin devolución: espera al inquilino (no puede saltear)', () => {
    const step = getReservationStep(reservation({ status: 'ACTIVE' }), 'owner')
    expect(step.kind).toBe('wait')
    expect(step.kind).not.toBe('action')
  })

  it('ACTIVE con devolución: confirma la recepción final', () => {
    expect(
      getReservationStep(
        reservation({ status: 'ACTIVE', renterReturnedAt: '2026-09-30T12:00:00.000Z' }),
        'owner',
      ),
    ).toEqual({ kind: 'action', key: 'confirmReturn', label: 'Confirmar recepción' })
  })

  it('COMPLETED: puede calificar al inquilino', () => {
    expect(getReservationStep(reservation({ status: 'COMPLETED' }), 'owner')).toEqual({
      kind: 'rate',
    })
  })
})

describe('getReservationStep — flujo del inquilino', () => {
  it('CONFIRMED sin entrega: espera al dueño (no puede saltear)', () => {
    const step = getReservationStep(reservation(), 'renter')
    expect(step.kind).toBe('wait')
    expect(step.kind).not.toBe('action')
  })

  it('CONFIRMED con entrega: confirma la recepción', () => {
    expect(
      getReservationStep(
        reservation({ actualHandoffAt: '2026-09-30T10:00:00.000Z' }),
        'renter',
      ),
    ).toEqual({ kind: 'action', key: 'confirmHandoff', label: 'Confirmar recepción' })
  })

  it('ACTIVE sin devolución: marca como devuelto', () => {
    expect(getReservationStep(reservation({ status: 'ACTIVE' }), 'renter')).toEqual({
      kind: 'action',
      key: 'return',
      label: 'Marcar como devuelto',
    })
  })

  it('ACTIVE con devolución: espera la confirmación del dueño', () => {
    const step = getReservationStep(
      reservation({ status: 'ACTIVE', renterReturnedAt: '2026-09-30T12:00:00.000Z' }),
      'renter',
    )
    expect(step.kind).toBe('wait')
  })

  it('COMPLETED: puede calificar al dueño', () => {
    expect(getReservationStep(reservation({ status: 'COMPLETED' }), 'renter')).toEqual({
      kind: 'rate',
    })
  })
})

describe('getReservationStep — sin acción', () => {
  it.each(['PENDING', 'CANCELLED', 'DESCONOCIDO'])('estado %s: no ofrece acciones', (status) => {
    expect(getReservationStep(reservation({ status }), 'owner')).toEqual({ kind: 'none' })
    expect(getReservationStep(reservation({ status }), 'renter')).toEqual({ kind: 'none' })
  })

  it('reserva o rol inválido: no ofrece acciones', () => {
    expect(getReservationStep(null, 'owner')).toEqual({ kind: 'none' })
    expect(getReservationStep(reservation(), 'admin')).toEqual({ kind: 'none' })
    expect(getReservationStep(reservation(), null)).toEqual({ kind: 'none' })
  })
})

describe('mergeReservationUpdate — respuestas PATCH parciales', () => {
  it('pisa solo los campos presentes y conserva el resto', () => {
    const current = reservation({
      status: 'CONFIRMED',
      actualHandoffAt: '2026-09-30T10:00:00.000Z',
      renterReceivedAt: null,
    })

    const merged = mergeReservationUpdate(current, {
      id: 'res-1',
      status: 'ACTIVE',
      renterReceivedAt: '2026-09-30T11:00:00.000Z',
    })

    expect(merged).toMatchObject({
      status: 'ACTIVE',
      actualHandoffAt: '2026-09-30T10:00:00.000Z',
      renterReceivedAt: '2026-09-30T11:00:00.000Z',
    })
  })

  it('nunca reemplaza valores existentes con `undefined`', () => {
    const current = reservation({
      status: 'CONFIRMED',
      actualHandoffAt: '2026-09-30T10:00:00.000Z',
      renterReceivedAt: '2026-09-30T11:00:00.000Z',
    })

    const merged = mergeReservationUpdate(current, {
      id: 'res-1',
      status: undefined,
      actualHandoffAt: undefined,
      renterReceivedAt: undefined,
      renterReturnedAt: undefined,
      actualReturnAt: undefined,
    })

    expect(merged).toEqual(current)
  })
})

describe('getRatingView — modelo de estado de calificación', () => {
  it('desconocido o checking nunca ofrecen `Calificar`', () => {
    expect(getRatingView({}, 'res-1')).toEqual({ kind: 'checking' })
    expect(getRatingView(null, 'res-1')).toEqual({ kind: 'checking' })
    expect(getRatingView({ 'res-1': { status: 'checking', score: null } }, 'res-1')).toEqual({
      kind: 'checking',
    })
    expect(getRatingView({ 'res-1': { status: 'inesperado' } }, 'res-1')).toEqual({
      kind: 'checking',
    })
  })

  it('rated conserva el puntaje y unrated ofrece calificar', () => {
    expect(getRatingView({ 'res-1': { status: 'rated', score: 5 } }, 'res-1')).toEqual({
      kind: 'rated',
      score: 5,
    })
    expect(getRatingView({ 'res-1': { status: 'unrated', score: null } }, 'res-1')).toEqual({
      kind: 'rate',
    })
  })

  it('error ofrece reintento sin acción ciega', () => {
    expect(getRatingView({ 'res-1': { status: 'error', score: null } }, 'res-1')).toEqual({
      kind: 'retry',
    })
  })
})

describe('selectAgendaReservations — Agenda operativa', () => {
  const NOW = new Date('2026-10-02T12:00:00.000Z')

  function agendaReservation(overrides = {}) {
    return {
      id: 'res-1',
      status: 'CONFIRMED',
      actualHandoffAt: null,
      renterReceivedAt: null,
      renterReturnedAt: null,
      actualReturnAt: null,
      dateInit: '2026-10-10T12:00:00.000Z',
      dateEnd: '2026-10-12T12:00:00.000Z',
      ...overrides,
    }
  }

  it('excluye PENDING y CANCELLED aunque tengan fecha futura', () => {
    const list = [
      agendaReservation({ id: 'p', status: 'PENDING' }),
      agendaReservation({ id: 'c', status: 'CANCELLED' }),
    ]
    expect(selectAgendaReservations(list, 'owner', {}, NOW)).toEqual([])
    expect(selectAgendaReservations(list, 'renter', {}, NOW)).toEqual([])
  })

  it('CONFIRMED futura con paso operativo queda visible para ambos roles', () => {
    const list = [agendaReservation()]
    expect(selectAgendaReservations(list, 'owner', {}, NOW).map((r) => r.id)).toEqual(['res-1'])
    expect(selectAgendaReservations(list, 'renter', {}, NOW).map((r) => r.id)).toEqual(['res-1'])
  })

  it('CONFIRMED vencida se oculta aunque siga operativamente abierta', () => {
    const list = [
      agendaReservation({ dateInit: '2026-09-01T12:00:00.000Z', dateEnd: '2026-09-03T12:00:00.000Z' }),
    ]
    expect(selectAgendaReservations(list, 'owner', {}, NOW)).toEqual([])
    expect(selectAgendaReservations(list, 'renter', {}, NOW)).toEqual([])
  })

  it('ACTIVE vencida se oculta aunque todavía sea accionable', () => {
    const list = [
      agendaReservation({
        status: 'ACTIVE',
        dateInit: '2026-09-01T12:00:00.000Z',
        dateEnd: '2026-09-03T12:00:00.000Z',
      }),
    ]
    expect(selectAgendaReservations(list, 'renter', {}, NOW)).toEqual([])
    expect(selectAgendaReservations(list, 'owner', {}, NOW)).toEqual([])
  })

  it('COMPLETED vencida sin calificar sigue visible', () => {
    const list = [
      agendaReservation({
        id: 'done-past',
        status: 'COMPLETED',
        dateInit: '2026-09-01T12:00:00.000Z',
        dateEnd: '2026-09-03T12:00:00.000Z',
      }),
    ]
    expect(selectAgendaReservations(list, 'owner', {}, NOW).map((r) => r.id)).toEqual(['done-past'])
    expect(selectAgendaReservations(list, 'renter', {}, NOW).map((r) => r.id)).toEqual(['done-past'])
  })

  it('COMPLETED sin calificar visible; ya calificada excluida', () => {
    const completed = agendaReservation({ id: 'done', status: 'COMPLETED' })
    expect(selectAgendaReservations([completed], 'owner', {}, NOW).map((r) => r.id)).toEqual(['done'])
    expect(
      selectAgendaReservations([completed], 'owner', { done: { status: 'unrated', score: null } }, NOW).map((r) => r.id),
    ).toEqual(['done'])
    expect(
      selectAgendaReservations([completed], 'owner', { done: { status: 'error', score: null } }, NOW).map((r) => r.id),
    ).toEqual(['done'])
    expect(
      selectAgendaReservations([completed], 'owner', { done: { status: 'rated', score: 5 } }, NOW),
    ).toEqual([])
  })

  it('ordena por fecha operativa con desempate por id', () => {
    const list = [
      agendaReservation({ id: 'b', dateInit: '2026-10-20T12:00:00.000Z', dateEnd: '2026-10-22T12:00:00.000Z' }),
      agendaReservation({ id: 'a', dateInit: '2026-10-10T12:00:00.000Z', dateEnd: '2026-10-12T12:00:00.000Z' }),
      agendaReservation({ id: 'c', status: 'ACTIVE', dateInit: '2026-09-01T12:00:00.000Z', dateEnd: '2026-10-11T12:00:00.000Z' }),
    ]
    expect(selectAgendaReservations(list, 'owner', {}, NOW).map((r) => r.id)).toEqual(['a', 'c', 'b'])
  })

  it('rol inválido o lista inválida devuelven vacío', () => {
    expect(selectAgendaReservations([agendaReservation()], 'admin', {}, NOW)).toEqual([])
    expect(selectAgendaReservations(null, 'owner', {}, NOW)).toEqual([])
  })
})
