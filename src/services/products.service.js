import apiClient from './api'

// ADAPTER — mapea el contrato del backend al shape de display del frontend.
// Forward-compatible: los campos que el backend aún no expone (rating, reviews,
// policies, distance, owner, deliveryMethod, etc. — módulos en desarrollo) se
// mapean con defaults neutrales para que sean drop-in cuando se terminen.
export function mapProduct(p) {
  const photos = Array.isArray(p.photos) ? p.photos : []

  return {
    id: p.id,
    ownerId: p.ownerId,
    title: p.title,
    description: p.descripcion,
    pricePerDay: p.priceDay,
    priceMonth: p.priceMonth,
    deposit: p.deposit,
    category: p.category,
    region: p.zone,
    city: p.city,
    state: p.state,
    address: p.address,
    deliveryMethod: p.deliveryMethod ?? null,
    imageUrl: photos[0]?.url ?? null,
    images: photos.map((photo) => photo.url),
    isAvailable: p.isAvailable,
    rating: p.rating ?? null,
    reviewCount: p.reviewCount ?? 0,
    completedRentals: p.completedRentals ?? 0,
    distance: p.distance ?? null,
    reviews: p.reviews ?? [],
    policies: p.policies ?? null,
    owner: p.owner ?? null,
  }
}

export async function fetchProducts() {
  const data = await apiClient('/products')
  const list = Array.isArray(data) ? data : []
  return list.map(mapProduct)
}

export async function fetchProduct(id) {
  const data = await apiClient(`/products/${id}`)
  return mapProduct(data)
}

export async function fetchPublicProfile(userId) {
  return apiClient(`/user/${userId}`)
}
