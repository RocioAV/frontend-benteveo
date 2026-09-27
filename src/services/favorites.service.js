import apiClient from './api'
import { mapProduct } from './products.service'

export async function fetchFavoriteIds() {
  const data = await apiClient('/favorites/ids')
  return Array.isArray(data) ? data : []
}

export async function fetchFavorites() {
  const data = await apiClient('/favorites')
  return Array.isArray(data) ? data.map(mapProduct) : []
}

export async function addFavorite(productId) {
  return apiClient(`/favorites/${productId}`, { method: 'POST' })
}

export async function removeFavorite(productId) {
  return apiClient(`/favorites/${productId}`, { method: 'DELETE' })
}
