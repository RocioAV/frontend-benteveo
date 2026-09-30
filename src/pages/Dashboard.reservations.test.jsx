import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgendaList, ReservasList } from './Dashboard.jsx'

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('../components/modals/reservationDetail.map.js', () => ({
  fetchReservationDetail: vi.fn(),
}))

// motion se aísla: el foco es el cableado de acciones, no las animaciones.
vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => tag,
    },
  ),
  MotionConfig: ({ children }) => children,
  AnimatePresence: ({ children }) => children,
}))

function reservation(overrides = {}) {
  return {
    id: 'res-1',
    status: 'CONFIRMED',
    actualHandoffAt: null,
    renterReceivedAt: null,
    renterReturnedAt: null,
    actualReturnAt: null,
    createdAt: '2026-09-20T10:00:00.000Z',
    dateInit: '2026-12-10T12:00:00.000Z',
    dateEnd: '2026-12-12T12:00:00.000Z',
    user: { name: 'Inquilino Uno' },
    product: { id: 'prod-1', title: 'Taladro', pricePerDay: 5000, imageUrl: null },
    ...overrides,
  }
}

function renderList(ui) {
  return render(ui)
}

describe('ReservasList — flujo bilateral', () => {
  it('dueño en CONFIRMED sin entrega: ofrece marcar como entregado', async () => {
    const onReservationAction = vi.fn()
    const user = userEvent.setup()
    renderList(
      <ReservasList
        renter={[]}
        owner={[reservation()]}
        userName="Dueño"
        onCancel={vi.fn()}
        onChat={vi.fn()}
        onReservationAction={onReservationAction}
        onRate={vi.fn()}
        ratingState={{}}
        onDetailAction={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    await user.click(screen.getByRole('button', { name: /marcar como entregado/i }))

    expect(onReservationAction).toHaveBeenCalledWith('handoff', expect.objectContaining({ id: 'res-1' }))
  })

  it('inquilino en CONFIRMED sin entrega: espera al dueño sin acciones ajenas', async () => {
    renderList(
      <ReservasList
        renter={[reservation()]}
        owner={[]}
        userName="Inquilino"
        onCancel={vi.fn()}
        onChat={vi.fn()}
        onReservationAction={vi.fn()}
        onRate={vi.fn()}
        ratingState={{}}
        onDetailAction={vi.fn()}
      />,
    )

    expect(
      await screen.findByText(/esperando que el dueño marque la entrega/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como entregado/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar recepción/i })).not.toBeInTheDocument()
  })

  it('inquilino en CONFIRMED con entrega: confirma la recepción', async () => {
    const onReservationAction = vi.fn()
    const user = userEvent.setup()
    renderList(
      <ReservasList
        renter={[reservation({ actualHandoffAt: '2026-09-30T10:00:00.000Z' })]}
        owner={[]}
        userName="Inquilino"
        onCancel={vi.fn()}
        onChat={vi.fn()}
        onReservationAction={onReservationAction}
        onRate={vi.fn()}
        ratingState={{}}
        onDetailAction={vi.fn()}
      />,
    )

    await user.click(await screen.findByRole('button', { name: /confirmar recepción/i }))

    expect(onReservationAction).toHaveBeenCalledWith(
      'confirmHandoff',
      expect.objectContaining({ id: 'res-1' }),
    )
  })

  it('dueño en ACTIVE con devolución: confirma la recepción final', async () => {
    const onReservationAction = vi.fn()
    const user = userEvent.setup()
    renderList(
      <ReservasList
        renter={[]}
        owner={[reservation({ status: 'ACTIVE', renterReturnedAt: '2026-09-30T12:00:00.000Z' })]}
        userName="Dueño"
        onCancel={vi.fn()}
        onChat={vi.fn()}
        onReservationAction={onReservationAction}
        onRate={vi.fn()}
        ratingState={{}}
        onDetailAction={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar recepción/i }))

    expect(onReservationAction).toHaveBeenCalledWith(
      'confirmReturn',
      expect.objectContaining({ id: 'res-1' }),
    )
  })

  it('dueño en ACTIVE sin devolución: espera al inquilino sin saltear el paso', async () => {
    const user = userEvent.setup()
    renderList(
      <ReservasList
        renter={[]}
        owner={[reservation({ status: 'ACTIVE' })]}
        userName="Dueño"
        onCancel={vi.fn()}
        onChat={vi.fn()}
        onReservationAction={vi.fn()}
        onRate={vi.fn()}
        ratingState={{}}
        onDetailAction={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    expect(
      await screen.findByText(/esperando que el inquilino marque la devolución/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar recepción/i })).not.toBeInTheDocument()
  })

  it('COMPLETED verificado sin calificar: ofrece calificar y luego no reaparece', async () => {
    const onRate = vi.fn()
    const user = userEvent.setup()
    const { rerender } = renderList(
      <ReservasList
        renter={[reservation({ status: 'COMPLETED' })]}
        owner={[]}
        userName="Inquilino"
        onCancel={vi.fn()}
        onChat={vi.fn()}
        onReservationAction={vi.fn()}
        onRate={onRate}
        ratingState={{ 'res-1': { status: 'unrated', score: null } }}
        onDetailAction={vi.fn()}
      />,
    )

    await user.click(await screen.findByRole('button', { name: /calificar/i }))
    expect(onRate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'res-1' }),
      expect.anything(),
    )

    rerender(
      <ReservasList
        renter={[reservation({ status: 'COMPLETED' })]}
        owner={[]}
        userName="Inquilino"
        onCancel={vi.fn()}
        onChat={vi.fn()}
        onReservationAction={vi.fn()}
        onRate={onRate}
        ratingState={{ 'res-1': { status: 'rated', score: 5 } }}
        onDetailAction={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /calificar/i })).not.toBeInTheDocument()
    expect(screen.getByText(/ya calificaste esta reserva/i)).toBeInTheDocument()
  })

  it('COMPLETED desconocido: nunca muestra un `Calificar` falso', async () => {
    renderList(
      <ReservasList
        renter={[reservation({ status: 'COMPLETED' })]}
        owner={[]}
        userName="Inquilino"
        onCancel={vi.fn()}
        onChat={vi.fn()}
        onReservationAction={vi.fn()}
        onRate={vi.fn()}
        ratingState={{}}
        onDetailAction={vi.fn()}
      />,
    )

    expect(await screen.findByRole('button', { name: /verificando/i })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
  })

  it('COMPLETED con error de verificación: ofrece reintentar sin POST duplicado', async () => {
    const onRate = vi.fn()
    const user = userEvent.setup()
    renderList(
      <ReservasList
        renter={[reservation({ status: 'COMPLETED' })]}
        owner={[]}
        userName="Inquilino"
        onCancel={vi.fn()}
        onChat={vi.fn()}
        onReservationAction={vi.fn()}
        onRate={onRate}
        ratingState={{ 'res-1': { status: 'error', score: null } }}
        onDetailAction={vi.fn()}
      />,
    )

    expect(await screen.findByText(/no pudimos verificar tu calificación/i)).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /^calificar/i }))
    expect(onRate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'res-1' }),
      expect.anything(),
    )
  })

  it('mientras se verifica `mine`: muestra estado deshabilitado sin abrir nada', async () => {
    renderList(
      <ReservasList
        renter={[reservation({ status: 'COMPLETED' })]}
        owner={[]}
        userName="Inquilino"
        onCancel={vi.fn()}
        onChat={vi.fn()}
        onReservationAction={vi.fn()}
        onRate={vi.fn()}
        ratingState={{ 'res-1': { status: 'checking', score: null } }}
        onDetailAction={vi.fn()}
      />,
    )

    expect(await screen.findByRole('button', { name: /verificando/i })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
  })
})

describe('AgendaList — acciones del dueño', () => {
  it('expone la acción bilateral y la dispara con su clave', async () => {
    const onReservationAction = vi.fn()
    const user = userEvent.setup()
    render(<AgendaList reservations={[reservation()]} onChat={vi.fn()} onReservationAction={onReservationAction} />)

    await user.click(await screen.findByRole('button', { name: /marcar como entregado/i }))

    expect(onReservationAction).toHaveBeenCalledWith(
      'handoff',
      expect.objectContaining({ id: 'res-1' }),
    )
  })
})
