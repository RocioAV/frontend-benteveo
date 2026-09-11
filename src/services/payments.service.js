import apiClient from './api.js'

export async function createPaymentPreference(paymentId) {
  return apiClient(`/payments/${paymentId}/preference`, {
    method: 'POST',
  })
}
