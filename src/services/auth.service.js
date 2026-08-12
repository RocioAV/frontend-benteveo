import apiClient from './api'

export function login({ email, password }) {
  return apiClient('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function fetchUserData() {
  return apiClient('/user/data-user')
}

export function register(data) {
  return apiClient('/auth/register', {
    method: 'POST',
    body: data,
  })
}

export function forgotPassword(email) {
  return apiClient('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}
