import api from './api'
import { mapProduct } from './products.service.js'

export async function fetchRecentUsers(limit = 10) {
  return api(`/user/recent?limit=${limit}`)
}

export async function fetchUserByDni(dni) {
  return api(`/user/dni/${encodeURIComponent(dni)}`)
}

export async function fetchPendingVerifications() {
  return api('/verification/pending')
}

export async function approveVerification(id) {
  return api(`/verification/${id}/approve`, { method: 'POST' })
}

export async function rejectVerification(id, reviewNotes) {
  return api(`/verification/${id}/reject`, {
    method: 'POST',
    body: { reviewNotes },
  })
}

export async function fetchProductsByOwner(ownerId) {
  const data = await api(`/products/owner/${ownerId}`)
  const list = Array.isArray(data) ? data : []
  return list.map(mapProduct)
}

export async function adminDeleteProduct(id) {
  return api(`/products/${id}`, { method: 'DELETE' })
}

export async function fetchReservationsByUser(userId) {
  return api(`/reservations/all?userId=${userId}`)
}

export async function adminCancelReservation(id) {
  return api(`/reservations/${id}/cancel`, { method: 'PATCH' })
}
