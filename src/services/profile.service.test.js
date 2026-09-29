import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from './api'
import { updateProfile } from './profile.service'

vi.mock('./api', () => ({
  default: vi.fn(),
}))

beforeEach(() => {
  apiClient.mockReset()
})

describe('updateProfile', () => {
  it('envía un PATCH parcial a /user/data-user con el wrapper api()', async () => {
    apiClient.mockResolvedValue({ id: 'user-1', name: 'Nuevo Nombre' })

    await updateProfile({ name: 'Nuevo Nombre' })

    expect(apiClient).toHaveBeenCalledWith('/user/data-user', {
      method: 'PATCH',
      body: { name: 'Nuevo Nombre' },
    })
  })

  it('acepta phone y description (alias persistido de bio) en el mismo pedido', async () => {
    apiClient.mockResolvedValue({ id: 'user-1' })

    await updateProfile({ phone: '1123456789', description: 'Sobre mí' })

    expect(apiClient).toHaveBeenCalledWith('/user/data-user', {
      method: 'PATCH',
      body: { phone: '1123456789', description: 'Sobre mí' },
    })
  })

  it('permite limpiar la presentación con description vacía', async () => {
    apiClient.mockResolvedValue({ id: 'user-1' })

    await updateProfile({ description: '' })

    expect(apiClient).toHaveBeenCalledWith('/user/data-user', {
      method: 'PATCH',
      body: { description: '' },
    })
  })
})
