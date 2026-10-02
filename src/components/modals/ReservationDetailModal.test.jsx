import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReservationDetailModal from './ReservationDetailModal.jsx'

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

function detail(overrides = {}) {
  return {
    id: 'res-1',
    statusCode: 'CONFIRMED',
    status: 'Confirmada',
    actualHandoffAt: null,
    renterReceivedAt: null,
    renterReturnedAt: null,
    actualReturnAt: null,
    category: 'Herramientas',
    title: 'Taladro',
    image: null,
    pickup: '10 dic',
    dropoff: '12 dic',
    dateInit: '2026-12-10T12:00:00.000Z',
    duration: '2 días de alquiler',
    client: 'Inquilino Uno',
    owner: 'Dueño Uno',
    contact: '—',
    pickupLocation: '—',
    deposit: '$10.000 (reembolsable)',
    total: '$20.000',
    note: '',
    ...overrides,
  }
}

describe('ReservationDetailModal — flujo bilateral del dueño', () => {
  it('ofrece marcar como entregado y conserva un nombre accesible mientras procesa', async () => {
    let resolveAction
    const onAction = vi.fn(
      () => new Promise((resolve) => { resolveAction = resolve }),
    )
    const user = userEvent.setup()
    render(
      <ReservationDetailModal
        isOpen
        reservation={detail()}
        viewer="owner"
        onClose={vi.fn()}
        onAction={onAction}
      />,
    )

    await user.click(await screen.findByRole('button', { name: /marcar como entregado/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar entrega/i }))

    expect(onAction).toHaveBeenCalledWith('handoff', expect.objectContaining({ id: 'res-1' }))
    // Mientras el PATCH vuela, el botón sigue teniendo nombre accesible.
    expect(
      await screen.findByRole('button', { name: /procesando/i }),
    ).toBeInTheDocument()

    resolveAction({ id: 'res-1', status: 'CONFIRMED' })
    expect(
      await screen.findByText(/esperando que el inquilino confirme/i),
    ).toBeInTheDocument()
  })

  it('el inquilino sin entrega no ve acciones bilaterales', async () => {
    render(
      <ReservationDetailModal
        isOpen
        reservation={detail()}
        viewer="renter"
        onClose={vi.fn()}
        onAction={vi.fn()}
      />,
    )

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /marcar como entregado/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /confirmar recepción/i }),
    ).not.toBeInTheDocument()
  })
})

describe('ReservationDetailModal — modo seguimiento readOnly (Mis reservas)', () => {
  it('oculta la acción bilateral aunque la reserva sea accionable', async () => {
    const onAction = vi.fn()
    render(
      <ReservationDetailModal
        isOpen
        reservation={detail()}
        viewer="owner"
        readOnly
        onClose={vi.fn()}
        onAction={onAction}
      />,
    )

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Taladro')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /marcar como entregado/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /confirmar entrega/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /confirmar recepción/i }),
    ).not.toBeInTheDocument()
    expect(onAction).not.toHaveBeenCalled()
  })

  it('conserva Cancelar reserva y lo propaga con `cancel`', async () => {
    const onAction = vi.fn().mockResolvedValue({ id: 'res-1', status: 'CANCELLED' })
    const user = userEvent.setup()
    render(
      <ReservationDetailModal
        isOpen
        reservation={detail()}
        viewer="owner"
        readOnly
        onClose={vi.fn()}
        onAction={onAction}
      />,
    )

    await user.click(await screen.findByRole('button', { name: /cancelar reserva/i }))
    await user.click(await screen.findByRole('button', { name: /sí, cancelar/i }))

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledWith('cancel', expect.objectContaining({ id: 'res-1' }))
    expect(await screen.findByText(/reserva cancelada/i)).toBeInTheDocument()
  })

  it('oculta la recepción del inquilino accionable en modo seguimiento', async () => {
    render(
      <ReservationDetailModal
        isOpen
        reservation={detail({
          statusCode: 'CONFIRMED',
          actualHandoffAt: '2026-09-30T10:00:00.000Z',
        })}
        viewer="renter"
        readOnly
        onClose={vi.fn()}
        onAction={vi.fn()}
      />,
    )

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /confirmar recepción/i }),
    ).not.toBeInTheDocument()
  })
})
