import api from './api'

// POST /verification — sube frente, dorso y selfie del DNI (multipart/form-data).
// El wrapper api() no setea Content-Type (el navegador define el boundary) e
// inyecta el header x-csrf-token desde la caché CSRF.
export async function submitVerification({ front, back, selfie }) {
  const formData = new FormData()
  if (front) formData.append('front', front)
  if (back) formData.append('back', back)
  if (selfie) formData.append('selfie', selfie)

  return api('/verification', {
    method: 'POST',
    body: formData,
  })
}

// GET /verification — estado actual del pedido de verificación (o null si no hay).
export async function fetchVerificationStatus() {
  return api('/verification')
}
