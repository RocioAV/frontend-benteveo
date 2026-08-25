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

// Confirma una reserva (PATCH /reservations/:id/confirm) — PENDING → CONFIRMED.
export async function confirmReservation(id) {
  return apiClient(`/reservations/${id}/confirm`, { method: 'PATCH' })
}

// Confirma la entrega del producto (PATCH /reservations/:id/handoff) — CONFIRMED → ACTIVE.
export async function handoffReservation(id) {
  return apiClient(`/reservations/${id}/handoff`, { method: 'PATCH' })
}

// Confirma la devolución del cliente (PATCH /reservations/:id/return) — ACTIVE → COMPLETED.
export async function returnReservation(id) {
  return apiClient(`/reservations/${id}/return`, { method: 'PATCH' })
}
