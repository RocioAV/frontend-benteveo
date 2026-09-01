const BASE_URL = import.meta.env.VITE_API_URL

// Caché en memoria del token CSRF de la sesión. No vive en localStorage:
// se obtiene del endpoint /auth/csrf (eco de la cookie no-HttpOnly) y se
// reutiliza entre llamadas hasta que `clearCsrf()` la invalida (logout).
let cachedToken = null

// GET /auth/csrf → { csrfToken }. Si ya hay token cacheado, se reutiliza sin
// nuevo fetch. No cachea null: pre-login el endpoint devuelve { csrfToken: null }
// y tras el login la siguiente llamada vuelve a pedir el token real.
export async function fetchCsrf() {
  if (cachedToken) {
    return cachedToken
  }

  const response = await fetch(`${BASE_URL}/auth/csrf`, {
    credentials: 'include',
  })

  if (!response.ok) {
    return null
  }

  let data
  try {
    data = await response.json()
  } catch {
    return null
  }

  const token = data && typeof data.csrfToken === 'string' ? data.csrfToken : null
  if (token) {
    cachedToken = token
  }
  return token
}

export function clearCsrf() {
  cachedToken = null
}

// Lectura de la caché para el wrapper api() (inyección del header x-csrf-token).
export function getCsrfToken() {
  return cachedToken
}
