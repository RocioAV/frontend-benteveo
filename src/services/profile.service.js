import api from './api'

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
