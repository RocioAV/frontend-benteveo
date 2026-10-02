import apiClient from './api'

// Califica a la contraparte de una reserva COMPLETED (POST /reservations/:id/user-rating).
// El backend deriva `ratedUserId` desde la reserva: el frontend solo envía `{ score }`.
export async function submitUserRating(reservationId, score) {
  return apiClient(`/reservations/${reservationId}/user-rating`, {
    method: 'POST',
    body: { score },
  })
}

// Indica si el participante actual ya calificó esta reserva
// (GET /reservations/:id/user-rating/mine) → `{ rated, rating }`.
export async function fetchMyUserRating(reservationId) {
  return apiClient(`/reservations/${reservationId}/user-rating/mine`)
}
