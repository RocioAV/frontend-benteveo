import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'react-toastify'
import { REFUND_DELAY_MS, simulateDepositRefund } from './refund-simulation.js'

vi.mock('react-toastify', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

const infoMock = vi.mocked(toast.info)
const successMock = vi.mocked(toast.success)

describe('simulateDepositRefund — reembolso simulado con dos toasts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    infoMock.mockReset()
    successMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cancel: toast de progreso y, a los 5s, toast de éxito', () => {
    simulateDepositRefund('cancel')

    expect(infoMock).toHaveBeenCalledTimes(1)
    const [pendingMessage, pendingOptions] = infoMock.mock.calls[0]
    expect(pendingMessage).toMatch(/procesando el reembolso del depósito/i)
    expect(pendingOptions).toMatchObject({ autoClose: REFUND_DELAY_MS })
    expect(successMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(REFUND_DELAY_MS - 1)
    expect(successMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(successMock).toHaveBeenCalledTimes(1)
    const [doneMessage, doneOptions] = successMock.mock.calls[0]
    expect(doneMessage).toMatch(/reserva cancelada\. depósito reembolsado\./i)
    expect(doneOptions).toMatchObject({ autoClose: 4000 })
  })

  it('return: libera el depósito al inquilino cuando el dueño confirma', () => {
    simulateDepositRefund('return')

    expect(infoMock.mock.calls[0][0]).toMatch(/devolución confirmada/i)
    expect(infoMock.mock.calls[0][1]).toMatchObject({ autoClose: REFUND_DELAY_MS })

    vi.advanceTimersByTime(REFUND_DELAY_MS)
    expect(successMock).toHaveBeenCalledTimes(1)
    expect(successMock.mock.calls[0][0]).toMatch(/depósito reembolsado al inquilino/i)
  })

  it('kind desconocido usa los mensajes de cancelación', () => {
    simulateDepositRefund('algo-desconocido')

    expect(infoMock.mock.calls[0][0]).toMatch(/cancelación en proceso/i)
    vi.advanceTimersByTime(REFUND_DELAY_MS)
    expect(successMock.mock.calls[0][0]).toMatch(/reserva cancelada/i)
  })

  it('cada simulación usa un toastId propio (no pisa toasts simultáneos)', () => {
    simulateDepositRefund('cancel')
    vi.advanceTimersByTime(REFUND_DELAY_MS / 2)
    simulateDepositRefund('cancel')

    const firstId = infoMock.mock.calls[0][1].toastId
    const secondId = infoMock.mock.calls[1][1].toastId
    expect(firstId).toBeDefined()
    expect(secondId).toBeDefined()
    expect(firstId).not.toBe(secondId)

    vi.advanceTimersByTime(REFUND_DELAY_MS)
    expect(successMock).toHaveBeenCalledTimes(2)
  })
})
