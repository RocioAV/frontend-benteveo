import apiClient from './api'

// Crea una reserva (requiere auth — el guard RequireAuth ya lo asegura).
// El backend espera `productId` (UUID) y fechas en formato ISO 8601.
export function createReservation({ productId, dateInit, dateEnd }) {
  return apiClient('/reservations', {
    method: 'POST',
    body: { productId, dateInit, dateEnd },
  })
}
