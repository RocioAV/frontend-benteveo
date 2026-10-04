import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from './api'
import { fetchMyUserRating, submitUserRating } from './user-ratings.service'

vi.mock('./api', () => ({
  default: vi.fn(),
}))

beforeEach(() => {
  apiClient.mockReset()
})

describe('submitUserRating', () => {
  it('envía solo `{ score }` sin ratedUserId (el backend deriva la contraparte)', async () => {
    apiClient.mockResolvedValue({ id: 'rating-1', score: 5 })

    await submitUserRating('res-1', 5)

    expect(apiClient).toHaveBeenCalledWith('/reservations/res-1/user-rating', {
      method: 'POST',
      body: { score: 5 },
    })
    const body = apiClient.mock.calls[0][1].body
    expect(body).toEqual({ score: 5 })
    expect(body).not.toHaveProperty('ratedUserId')
  })
})

describe('fetchMyUserRating', () => {
  it('devuelve `{ rated, rating }` del participante actual', async () => {
    apiClient.mockResolvedValue({ rated: true, rating: { id: 'rating-1', score: 4 } })

    const mine = await fetchMyUserRating('res-1')

    expect(apiClient).toHaveBeenCalledWith('/reservations/res-1/user-rating/mine')
    expect(mine).toEqual({ rated: true, rating: { id: 'rating-1', score: 4 } })
  })

  it('propaga el estado sin calificar', async () => {
    apiClient.mockResolvedValue({ rated: false, rating: null })

    const mine = await fetchMyUserRating('res-1')

    expect(mine).toEqual({ rated: false, rating: null })
  })
})
