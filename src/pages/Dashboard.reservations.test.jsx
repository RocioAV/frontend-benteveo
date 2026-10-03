import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgendaList, ReservasList } from './Dashboard.jsx'
import { fetchReservationDetail } from '../components/modals/reservationDetail.map.js'

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('../components/modals/reservationDetail.map.js', () => ({
  fetchReservationDetail: vi.fn(),
}))

const fetchDetailMock = vi.mocked(fetchReservationDetail)

beforeEach(() => {
  fetchDetailMock.mockReset()
})

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

function mappedDetail(overrides = {}) {
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

describe('ReservasList — seguimiento/historial (Bloque 3)', () => {
  function trackingProps(overrides = {}) {
    return {
      userName: 'Usuario',
      onChat: vi.fn(),
      ratingState: {},
      onDetailAction: vi.fn(),
      ...overrides,
    }
  }

  it('describe seguimiento/historial y no coordinación operativa', async () => {
    renderList(
      <ReservasList renter={[reservation()]} owner={[]} {...trackingProps()} />,
    )

    expect(await screen.findByRole('heading', { name: /mis reservas/i })).toBeInTheDocument()
    expect(screen.getByText(/seguimiento e historial/i)).toBeInTheDocument()
    expect(screen.queryByText(/coordiná entregas/i)).not.toBeInTheDocument()
  })

  it('dueño en CONFIRMED accionable: no muestra Marcar como entregado (vive en Agenda)', async () => {
    const user = userEvent.setup()
    renderList(
      <ReservasList renter={[]} owner={[reservation()]} {...trackingProps()} />,
    )

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como entregado/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar recepción/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como devuelto/i })).not.toBeInTheDocument()
  })

  it('inquilino en CONFIRMED sin entrega: conserva espera no interactiva sin acciones', async () => {
    renderList(
      <ReservasList renter={[reservation()]} owner={[]} {...trackingProps()} />,
    )

    expect(
      await screen.findByText(/esperando que el dueño marque la entrega/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como entregado/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar recepción/i })).not.toBeInTheDocument()
  })

  it('inquilino en CONFIRMED con entrega accionable: no muestra Confirmar recepción', async () => {
    renderList(
      <ReservasList
        renter={[reservation({ actualHandoffAt: '2026-09-30T10:00:00.000Z' })]}
        owner={[]}
        {...trackingProps()}
      />,
    )

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar recepción/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como devuelto/i })).not.toBeInTheDocument()
  })

  it('dueño en ACTIVE con devolución accionable: no muestra Confirmar recepción final', async () => {
    const user = userEvent.setup()
    renderList(
      <ReservasList
        renter={[]}
        owner={[reservation({ status: 'ACTIVE', renterReturnedAt: '2026-09-30T12:00:00.000Z' })]}
        {...trackingProps()}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar recepción/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como entregado/i })).not.toBeInTheDocument()
  })

  it('dueño en ACTIVE sin devolución: conserva espera sin acción ajena', async () => {
    const user = userEvent.setup()
    renderList(
      <ReservasList renter={[]} owner={[reservation({ status: 'ACTIVE' })]} {...trackingProps()} />,
    )

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    expect(
      await screen.findByText(/esperando que el inquilino marque la devolución/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar recepción/i })).not.toBeInTheDocument()
  })

  it('inquilino en ACTIVE accionable: no muestra Marcar como devuelto', async () => {
    renderList(
      <ReservasList renter={[reservation({ status: 'ACTIVE' })]} owner={[]} {...trackingProps()} />,
    )

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como devuelto/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar recepción/i })).not.toBeInTheDocument()
  })

  it('COMPLETED sin calificar: no ofrece Calificar (vive en Agenda)', async () => {
    renderList(
      <ReservasList
        renter={[reservation({ status: 'COMPLETED' })]}
        owner={[]}
        {...trackingProps({ ratingState: { 'res-1': { status: 'unrated', score: null } } })}
      />,
    )

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /calificar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /verificando/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/ya calificaste/i)).not.toBeInTheDocument()
  })

  it('COMPLETED ya calificada: conserva el hecho histórico `Ya calificaste (N/5)`', async () => {
    renderList(
      <ReservasList
        renter={[reservation({ status: 'COMPLETED' })]}
        owner={[]}
        {...trackingProps({ ratingState: { 'res-1': { status: 'rated', score: 5 } } })}
      />,
    )

    expect(await screen.findByText(/ya calificaste esta reserva \(5\/5\)/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /calificar/i })).not.toBeInTheDocument()
  })

  it('COMPLETED desconocido o en verificación: no muestra Calificar ni Verificando', async () => {
    const { rerender } = renderList(
      <ReservasList renter={[reservation({ status: 'COMPLETED' })]} owner={[]} {...trackingProps()} />,
    )

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /verificando/i })).not.toBeInTheDocument()

    rerender(
      <ReservasList
        renter={[reservation({ status: 'COMPLETED' })]}
        owner={[]}
        {...trackingProps({ ratingState: { 'res-1': { status: 'checking', score: null } } })}
      />,
    )

    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /verificando/i })).not.toBeInTheDocument()
  })

  it('COMPLETED con error de verificación: no muestra reintento interactivo', async () => {
    renderList(
      <ReservasList
        renter={[reservation({ status: 'COMPLETED' })]}
        owner={[]}
        {...trackingProps({ ratingState: { 'res-1': { status: 'error', score: null } } })}
      />,
    )

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/no pudimos verificar tu calificación/i)).not.toBeInTheDocument()
  })

  it('conserva Detalle y Chat; Cancelar vive dentro del detalle', async () => {
    const onChat = vi.fn()
    const user = userEvent.setup()
    fetchDetailMock.mockResolvedValue(mappedDetail())
    renderList(
      <ReservasList
        renter={[reservation()]}
        owner={[]}
        {...trackingProps({ onChat })}
      />,
    )

    expect(await screen.findByRole('button', { name: /detalle/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /chatear/i }))
    expect(onChat).toHaveBeenCalledWith('res-1')

    // La tarjeta ya no ofrece Cancelar: se hace desde el detalle.
    expect(screen.queryByRole('button', { name: /^cancelar/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /detalle/i }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(fetchDetailMock).toHaveBeenCalledWith('res-1', expect.anything())
    expect(await screen.findByRole('button', { name: /cancelar reserva/i })).toBeInTheDocument()
  })

  it('detalle desde Mis reservas no expone acciones operativas aunque sea accionable', async () => {
    const user = userEvent.setup()
    fetchDetailMock.mockResolvedValue(mappedDetail())
    renderList(
      <ReservasList renter={[]} owner={[reservation()]} {...trackingProps()} />,
    )

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    await user.click(await screen.findByRole('button', { name: /detalle/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como entregado/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar entrega/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar recepción/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar como devuelto/i })).not.toBeInTheDocument()
  })

  it('detalle en seguimiento ignora claves bilaterales y solo propaga cancelar', async () => {
    const onDetailAction = vi.fn().mockResolvedValue({ id: 'res-1', status: 'CANCELLED' })
    const user = userEvent.setup()
    fetchDetailMock.mockResolvedValue(mappedDetail())
    renderList(
      <ReservasList renter={[reservation()]} owner={[]} {...trackingProps({ onDetailAction })} />,
    )

    await user.click(await screen.findByRole('button', { name: /detalle/i }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    // El modal de seguimiento solo ofrece Cancelar reserva como gestión previa.
    await user.click(await screen.findByRole('button', { name: /cancelar reserva/i }))
    await user.click(await screen.findByRole('button', { name: /sí, cancelar/i }))

    await waitFor(() => expect(onDetailAction).toHaveBeenCalledTimes(1))
    expect(onDetailAction).toHaveBeenCalledWith('cancel', expect.objectContaining({ id: 'res-1' }))
  })

  it('muestra 9 días para una reserva del 1 al 10 de octubre (igual que el backend)', async () => {
    renderList(
      <ReservasList
        renter={[
          reservation({
            dateInit: '2026-10-01T12:00:00.000Z',
            dateEnd: '2026-10-10T12:00:00.000Z',
          }),
        ]}
        owner={[]}
        {...trackingProps()}
      />,
    )

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.getByText(/9 días/)).toBeInTheDocument()
  })

  it('usa el singular para una reserva válida de un día', async () => {
    renderList(
      <ReservasList
        renter={[
          reservation({
            dateInit: '2026-10-01T12:00:00.000Z',
            dateEnd: '2026-10-02T12:00:00.000Z',
          }),
        ]}
        owner={[]}
        {...trackingProps()}
      />,
    )

    expect(await screen.findByText('Taladro')).toBeInTheDocument()
    expect(screen.getByText(/1 día(?!s)/)).toBeInTheDocument()
  })
})

describe('AgendaList — Agenda operativa por rol', () => {
  function agendaProps(overrides = {}) {
    return {
      renterReservations: [],
      ownerReservations: [],
      onChat: vi.fn(),
      onReservationAction: vi.fn(),
      onRate: vi.fn(),
      ratingState: {},
      ...overrides,
    }
  }

  it('ofrece tabs por rol con accesibilidad básica y cambia de vista', async () => {
    const user = userEvent.setup()
    renderList(
      <AgendaList
        {...agendaProps({
          renterReservations: [reservation({ id: 'rent-1', product: { ...reservation().product, title: 'Taladro inquilino' } })],
          ownerReservations: [reservation({ id: 'own-1', product: { ...reservation().product, title: 'Sierra dueño' } })],
        })}
      />,
    )

    const tablist = screen.getByRole('tablist', { name: /agenda por rol/i })
    expect(tablist).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Como inquilino', 'Como dueño'])
    expect(screen.getByRole('tab', { name: /como inquilino/i })).toHaveAttribute('aria-selected', 'true')

    expect(screen.getByText('Taladro inquilino')).toBeInTheDocument()
    expect(screen.queryByText('Sierra dueño')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    expect(screen.getByRole('tab', { name: /como dueño/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Sierra dueño')).toBeInTheDocument()
    expect(screen.queryByText('Taladro inquilino')).not.toBeInTheDocument()
  })

  it('excluye PENDING y CANCELLED de Agenda', async () => {
    const user = userEvent.setup()
    renderList(
      <AgendaList
        {...agendaProps({
          renterReservations: [
            reservation({ id: 'p', status: 'PENDING', product: { ...reservation().product, title: 'Pendiente' } }),
            reservation({ id: 'c', status: 'CANCELLED', product: { ...reservation().product, title: 'Cancelada' } }),
            reservation({ id: 'ok', product: { ...reservation().product, title: 'Confirmada visible' } }),
          ],
        })}
      />,
    )

    expect(screen.getByText('Confirmada visible')).toBeInTheDocument()
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument()
    expect(screen.queryByText('Cancelada')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    expect(screen.getByText(/pendientes como dueño/i)).toBeInTheDocument()
  })

  it('CONFIRMED futura visible con espera; vencida oculta', () => {
    renderList(
      <AgendaList
        {...agendaProps({
          renterReservations: [
            reservation({ id: 'futura', dateInit: '2026-12-10T12:00:00.000Z', product: { ...reservation().product, title: 'Futura' } }),
            reservation({
              id: 'vencida',
              dateInit: '2020-01-10T12:00:00.000Z',
              dateEnd: '2020-01-12T12:00:00.000Z',
              product: { ...reservation().product, title: 'Vencida abierta' },
            }),
          ],
        })}
      />,
    )

    expect(screen.getByText('Futura')).toBeInTheDocument()
    expect(screen.queryByText('Vencida abierta')).not.toBeInTheDocument()
    expect(screen.getAllByText(/esperando que el dueño marque la entrega/i)).toHaveLength(1)
  })

  it('ACTIVE vencida no aparece en Agenda', () => {
    renderList(
      <AgendaList
        {...agendaProps({
          renterReservations: [
            reservation({
              id: 'active-vencida',
              status: 'ACTIVE',
              dateInit: '2020-01-10T12:00:00.000Z',
              dateEnd: '2020-01-12T12:00:00.000Z',
              product: { ...reservation().product, title: 'Activa vencida' },
            }),
          ],
        })}
      />,
    )

    expect(screen.queryByText('Activa vencida')).not.toBeInTheDocument()
    expect(screen.getByText(/no tenés entregas/i)).toBeInTheDocument()
  })

  it('ACTIVE accionable ofrece Marcar como devuelto al inquilino', async () => {
    const onReservationAction = vi.fn()
    const user = userEvent.setup()
    renderList(
      <AgendaList
        {...agendaProps({
          onReservationAction,
          renterReservations: [
            reservation({
              id: 'active-pendiente',
              status: 'ACTIVE',
              dateInit: '2099-01-10T12:00:00.000Z',
              dateEnd: '2099-01-12T12:00:00.000Z',
              product: { ...reservation().product, title: 'Activa pendiente' },
            }),
          ],
        })}
      />,
    )

    expect(screen.getByText('Activa pendiente')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /marcar como devuelto/i }))
    expect(onReservationAction).toHaveBeenCalledWith(
      'return',
      expect.objectContaining({ id: 'active-pendiente' }),
    )
  })

  it('acción correcta por rol: dueño marca entrega, inquilino confirma recepción', async () => {
    const onReservationAction = vi.fn()
    const user = userEvent.setup()
    renderList(
      <AgendaList
        {...agendaProps({
          onReservationAction,
          renterReservations: [
            reservation({
              id: 'rent-conf',
              actualHandoffAt: '2026-09-30T10:00:00.000Z',
              product: { ...reservation().product, title: 'Para confirmar' },
            }),
          ],
          ownerReservations: [reservation({ id: 'own-conf', product: { ...reservation().product, title: 'Para entregar' } })],
        })}
      />,
    )

    await user.click(screen.getByRole('button', { name: /confirmar recepción/i }))
    expect(onReservationAction).toHaveBeenCalledWith(
      'confirmHandoff',
      expect.objectContaining({ id: 'rent-conf' }),
    )

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    await user.click(screen.getByRole('button', { name: /marcar como entregado/i }))
    expect(onReservationAction).toHaveBeenCalledWith(
      'handoff',
      expect.objectContaining({ id: 'own-conf' }),
    )
  })

  it('COMPLETED sin calificar ofrece Calificar y ya calificada desaparece', async () => {
    const onRate = vi.fn()
    const user = userEvent.setup()
    const completed = reservation({ id: 'done', status: 'COMPLETED', product: { ...reservation().product, title: 'Completada' } })
    const { rerender } = renderList(
      <AgendaList {...agendaProps({ renterReservations: [completed], onRate, ratingState: { done: { status: 'unrated', score: null } } })} />,
    )

    await user.click(screen.getByRole('button', { name: /^calificar/i }))
    expect(onRate).toHaveBeenCalledWith(expect.objectContaining({ id: 'done' }), expect.anything())

    rerender(
      <AgendaList {...agendaProps({ renterReservations: [completed], onRate, ratingState: { done: { status: 'rated', score: 5 } } })} />,
    )
    expect(screen.queryByText('Completada')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^calificar/i })).not.toBeInTheDocument()
    expect(screen.getByText(/pendientes como inquilino/i)).toBeInTheDocument()
  })

  it('estado vacío coherente por rol y conserva Hablar en items', async () => {
    const user = userEvent.setup()
    renderList(<AgendaList {...agendaProps()} />)

    expect(screen.getByText(/pendientes como inquilino/i)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    expect(screen.getByText(/pendientes como dueño/i)).toBeInTheDocument()
    expect(screen.queryByText(/pendientes como inquilino/i)).not.toBeInTheDocument()
  })

  it('Hablar abre el chat de la reserva visible', async () => {
    const onChat = vi.fn()
    const user = userEvent.setup()
    renderList(
      <AgendaList
        {...agendaProps({
          onChat,
          renterReservations: [reservation({ id: 'chat-1', product: { ...reservation().product, title: 'Con chat' } })],
        })}
      />,
    )

    await user.click(screen.getByRole('button', { name: /hablar con/i }))
    expect(onChat).toHaveBeenCalledWith('chat-1')
  })

  it('Detalle abre el modal con acciones bilaterales y cancelar', async () => {
    const onDetailAction = vi.fn().mockResolvedValue({ id: 'res-1', status: 'CONFIRMED' })
    const user = userEvent.setup()
    fetchDetailMock.mockResolvedValue(mappedDetail())
    renderList(
      <AgendaList
        {...agendaProps({
          onDetailAction,
          userName: 'María',
          ownerReservations: [
            reservation({ product: { ...reservation().product, title: 'Sierra dueño' } }),
          ],
        })}
      />,
    )

    await user.click(screen.getByRole('tab', { name: /como dueño/i }))
    await user.click(screen.getByRole('button', { name: /ver detalle de la reserva/i }))

    const dialog = await screen.findByRole('dialog')
    expect(fetchDetailMock).toHaveBeenCalledWith('res-1', expect.anything())
    // En Agenda el detalle no es readOnly: ofrece la acción bilateral…
    expect(within(dialog).getByRole('button', { name: /marcar como entregado/i })).toBeInTheDocument()
    // …y cancelar mientras la reserva no esté en curso.
    await user.click(within(dialog).getByRole('button', { name: /cancelar reserva/i }))
    await user.click(within(dialog).getByRole('button', { name: /sí, cancelar/i }))

    await waitFor(() => expect(onDetailAction).toHaveBeenCalledTimes(1))
    expect(onDetailAction).toHaveBeenCalledWith('cancel', expect.objectContaining({ id: 'res-1' }))
  })
})
