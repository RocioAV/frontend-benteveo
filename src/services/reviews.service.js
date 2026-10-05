import apiClient from './api'

export async function fetchComments(productId) {
  const data = await apiClient(`/products/${productId}/comments`)
  return Array.isArray(data) ? data : []
}

export async function createComment(productId, text) {
  return apiClient(`/products/${productId}/comments`, {
    method: 'POST',
    body: { text },
  })
}

export async function deleteComment(commentId) {
  return apiClient(`/comments/${commentId}`, { method: 'DELETE' })
}

export async function fetchMyRating(productId) {
  const data = await apiClient(`/products/${productId}/ratings/mine`)
  return data && typeof data.score === 'number' ? data.score : null
}

export async function submitRating(productId, score) {
  return apiClient(`/products/${productId}/ratings`, {
    method: 'POST',
    body: { score },
  })
}
