import apiClient from './api'

export function login({ email, password }) {
  return apiClient('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function register(data) {
  return apiClient('/auth/register', {
    method: 'POST',
    body: data,
  })
}
