function generateCompletedRentals() {
  return Math.floor(Math.random() * 41) + 10
}

function generateDistance() {
  return `${(Math.random() * 10 + 0.5).toFixed(1)} km`
}

export function createProduct(apiData) {
  return {
    id: apiData.id,
    ownerId: apiData.ownerId,
    title: apiData.title,
    description: apiData.descripcion,
    pricePerDay: Number(apiData.priceDay),
    pricePerMonth: Number(apiData.priceMonth),
    deposit: Number(apiData.deposit),
    category: apiData.category,
    region: apiData.state,
    city: apiData.city,
    deliveryMethod: 'A coordinar',
    imageUrl: apiData.photos?.[0]?.url || '',
    isAvailable: apiData.isAvailable,
    rating: apiData.rating == null ? 0 : Number(apiData.rating),
    reviewCount: apiData.reviewCount == null ? 0 : Number(apiData.reviewCount),
    completedRentals: generateCompletedRentals(),
    distance: generateDistance(),
    policies:
      'Depósito mínimo requerido al momento de la reserva. El producto debe devolverse en las mismas condiciones. Se permite hasta 24 horas de gracia para cancelaciones sin cargo.',
    reviews: [],
  }
}
