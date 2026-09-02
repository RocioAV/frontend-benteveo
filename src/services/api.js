import { getCsrfToken } from './csrf.js'

const BASE_URL = import.meta.env.VITE_API_URL

const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// Error unificado (FEM-1/FEM-2): la UI ramifica por `code`, nunca por `message`.
export class ApiError extends Error {
  constructor(code, status, fields = null) {
    super(code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fields = fields
  }
}

// Wrapper único de fetch: autentica por cookie HttpOnly (credentials:'include')
// e inyecta el header x-csrf-token (desde la caché CSRF) en métodos unsafe.
export async function api(endpoint, { body, method = 'GET', headers = {} } = {}) {
  const config = {
    method,
    credentials: 'include',
    headers: { ...headers },
  }

  if (UNSAFE_METHODS.includes(method.toUpperCase())) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken
    }
  }

  if (body instanceof FormData) {
    // No se setea Content-Type: el navegador define el boundary multipart.
    config.body = body
  } else if (body !== undefined && body !== null) {
    config.headers['Content-Type'] = 'application/json'
    config.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config)
  } catch {
    throw new ApiError('NETWORK_ERROR', 0, null)
  }

  // 204 (login/logout): sin body, no intentar parsear JSON.
  if (response.status === 204) {
    return null
  }

  let data
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const code = data && typeof data.code === 'string' ? data.code : 'GENERIC'
    const fields = data && data.fields && typeof data.fields === 'object' ? data.fields : null
    throw new ApiError(code, response.status, fields)
  }

  return data
}

export default api
