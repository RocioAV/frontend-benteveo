import api from './api'

// PATCH /user/data-user — actualiza parcialmente el perfil autenticado.
// Solo acepta `name?`, `phone?` y `description?`. El formulario usa `bio`
// como alias visual de `description`: el mapeo bio → description vive en
// Dashboard.jsx y aquí nunca debe llegar `bio`, email, DNI, IDs ni otros campos.
export function updateProfile(data) {
  return api('/user/data-user', {
    method: 'PATCH',
    body: data,
  })
}

// POST /profile/avatar — sube la foto de perfil (multipart/form-data).
// El wrapper api() no setea Content-Type (el navegador define el boundary) e
// inyecta el header x-csrf-token desde la caché CSRF.
// Devuelve { avatar: string } con la URL de Cloudinary persistida en el perfil.
export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)

  return api('/profile/avatar', {
    method: 'POST',
    body: formData,
  })
}
