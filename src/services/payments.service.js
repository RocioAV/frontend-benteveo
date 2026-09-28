import apiClient from './api.js'

export async function createPaymentPreference(paymentId) {
  return apiClient(`/payments/${paymentId}/preference`, {
    method: 'POST',
  })
}

// Sincroniza el pago con Mercado Pago tras volver del checkout
// (POST /payments/:id/sync): si estaba aprobado, confirma la reserva.
export async function syncPayment(paymentId) {
  return apiClient(`/payments/${paymentId}/sync`, {
    method: 'POST',
  })
}
