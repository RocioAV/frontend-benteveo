import api from './api'

// login/logout devuelven void: el backend responde 204 (sin body) y el wrapper
// api() retorna null. La sesión vive en la cookie HttpOnly benteveo_session.
export function login({ email, password }) {
  return api('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function logout() {
  return api('/auth/logout', {
    method: 'POST',
  })
}

export function fetchUserData() {
  return api('/user/data-user')
}

export function register(data) {
  return api('/auth/register', {
    method: 'POST',
    body: data,
  })
}

export function forgotPassword(email) {
  return api('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}
