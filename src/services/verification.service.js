import apiClient from './api'

const BASE_URL = import.meta.env.VITE_API_URL

function getToken() {
  return localStorage.getItem('token')
}

// POST /verification — sube frente, dorso y selfie del DNI (multipart/form-data).
// El backend (pendiente) recibe los 3 archivos y crea un pedido con status PENDING.
export async function submitVerification({ front, back, selfie }) {
  const formData = new FormData()
  if (front) formData.append('front', front)
  if (back) formData.append('back', back)
  if (selfie) formData.append('selfie', selfie)

  const token = getToken()
  const response = await fetch(`${BASE_URL}/verification`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    const message =
      (Array.isArray(data.message) ? data.message.join(', ') : data.message) ||
      'No pudimos enviar la verificación.'
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// GET /verification — estado actual del pedido de verificación (o null si no hay).
export async function fetchVerificationStatus() {
  return apiClient('/verification')
}
