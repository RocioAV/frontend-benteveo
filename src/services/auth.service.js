import apiClient from './api'

const MOCK_USERS = [
  {
    email: 'juan@test.com',
    password: '1234',
    name: 'Juan Perez',
    roles: ['USER'],
  },
]

export function login({ email, password }) {
  const mockUser = MOCK_USERS.find(
    (user) => user.email === email && user.password === password
  )

  if (mockUser) {
    return Promise.resolve({
      access_token: `mock-token-${email}`,
      user: {
        email: mockUser.email,
        name: mockUser.name,
        roles: mockUser.roles,
      },
    })
  }

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

export function forgotPassword(email) {
  return apiClient('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}
