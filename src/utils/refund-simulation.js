import { toast } from 'react-toastify'

// Simulación del reembolso (FEM-1: la pasarela real aún no devuelve el
// reembolso). Dos toasts encadenados: uno de progreso que vive 5s y otro de
// éxito que aparece recién cuando termina esa espera. Se dispara SOLO después
// de que la API de la reserva respondió bien; ante un error queda el toast de
// error que ya muestra cada flujo.
export const REFUND_DELAY_MS = 5000

const REFUND_DONE_AUTO_CLOSE_MS = 4000

const MESSAGES = {
  cancel: {
    pending: 'Cancelación en proceso. Estamos procesando el reembolso del depósito…',
    done: 'Reserva cancelada. Depósito reembolsado.',
  },
  return: {
    pending: 'Devolución confirmada. Procesando el reembolso del depósito…',
    done: 'Depósito reembolsado al inquilino.',
  },
}

// kind: 'cancel' (cancelación de la reserva) | 'return' (el dueño confirma la
// recepción final y se libera el depósito al inquilino).
// El sufijo secuencial garantiza un toastId único aunque dos simulaciones
// corran en el mismo milisegundo (Date.now() solo no alcanza).
let refundSequence = 0

export function simulateDepositRefund(kind = 'cancel') {
  const messages = MESSAGES[kind] ?? MESSAGES.cancel
  refundSequence += 1
  const toastId = `refund-${kind}-${Date.now()}-${refundSequence}`

  toast.info(messages.pending, {
    toastId,
    autoClose: REFUND_DELAY_MS,
  })

  setTimeout(() => {
    toast.success(messages.done, {
      toastId: `${toastId}-done`,
      autoClose: REFUND_DONE_AUTO_CLOSE_MS,
    })
  }, REFUND_DELAY_MS)
}
