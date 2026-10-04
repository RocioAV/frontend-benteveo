import apiClient from './api'
import { mapProduct } from './products.service.js'

// Crea una reserva (requiere auth — el guard RequireAuth ya lo asegura).
// El backend espera `productId` (UUID) y fechas en formato ISO 8601.
export function createReservation({ productId, dateInit, dateEnd }) {
  return apiClient('/reservations', {
    method: 'POST',
    body: { productId, dateInit, dateEnd },
  })
}

// Adapta una reserva del backend al shape de display del frontend.
// El `product` crudo (priceDay, photos, descripcion, zone) se normaliza con
// `mapProduct` para que los componentes consuman `pricePerDay`, `imageUrl`, etc.
function mapReservation(reservation) {
  return {
    ...reservation,
    product: reservation.product ? mapProduct(reservation.product) : null,
  }
}

// Reservas del usuario autenticado como inquilino (GET /reservations).
export async function fetchMyReservations() {
  const data = await apiClient('/reservations')
  const list = Array.isArray(data) ? data : []
  return list.map(mapReservation)
}

// Reservas de los productos del usuario autenticado como dueño (GET /reservations/as-owner).
export async function fetchReservationsAsOwner() {
  const data = await apiClient('/reservations/as-owner')
  const list = Array.isArray(data) ? data : []
  return list.map(mapReservation)
}

// Cancela una reserva (PATCH /reservations/:id/cancel).
export async function cancelReservation(id) {
  return apiClient(`/reservations/${id}/cancel`, { method: 'PATCH' })
}

// Obtiene una reserva por id (GET /reservations/:id) con el product normalizado.
export async function fetchReservation(id) {
  const data = await apiClient(`/reservations/${id}`)
  return mapReservation(data)
}

// NOTA: no hay confirmación manual de PENDING → CONFIRMED: el backend no expone
// PATCH /reservations/:id/confirm (el pago aprobado deja la reserva en CONFIRMED).

// Marca la entrega del producto (PATCH /reservations/:id/handoff) — solo el dueño.
// La reserva permanece CONFIRMED y registra `actualHandoffAt`.
export async function handoffReservation(id) {
  return apiClient(`/reservations/${id}/handoff`, { method: 'PATCH' })
}

// El inquilino confirma la recepción (PATCH /reservations/:id/handoff/confirm) —
// CONFIRMED → ACTIVE; registra `renterReceivedAt`.
export async function confirmHandoffReceipt(id) {
  return apiClient(`/reservations/${id}/handoff/confirm`, { method: 'PATCH' })
}

// El inquilino marca la devolución (PATCH /reservations/:id/return) — la reserva
// permanece ACTIVE y registra `renterReturnedAt`.
export async function returnReservation(id) {
  return apiClient(`/reservations/${id}/return`, { method: 'PATCH' })
}

// El dueño confirma la recepción final (PATCH /reservations/:id/return/confirm) —
// ACTIVE → COMPLETED; registra `actualReturnAt`.
export async function confirmReturnReceipt(id) {
  return apiClient(`/reservations/${id}/return/confirm`, { method: 'PATCH' })
}
