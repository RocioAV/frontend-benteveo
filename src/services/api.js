const BASE_URL = import.meta.env.VITE_API_URL

// NOTA DE SEGURIDAD (Fase 5): el JWT vive en localStorage, expuesto a XSS
// (cualquier script inyectado puede leerlo). Recomendado: migrar a cookie httpOnly
// (el backend la setea con HttpOnly + Secure + SameSite; el frontend manda
// `credentials: 'include'` y NO puede leerla desde JS). Mitigación actual:
// CSP en index.html + escaping de React por defecto. Ver PLAN-MEJORAS-UX-UI.md §5.
function getToken() {
  return localStorage.getItem('token')
}

async function apiClient(endpoint, { body, method = 'GET', headers = {} } = {}) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  const token = getToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)

  const data = await response.json()

  if (!response.ok) {
    let message = 'Error en la solicitud'
    if (Array.isArray(data.message)) {
      message = data.message.join(', ')
    } else if (data.message) {
      message = data.message
    }
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export default apiClient
