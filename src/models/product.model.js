function generateRating() {
  return parseFloat((Math.random() * 1 + 4).toFixed(1))
}

function generateReviewCount() {
  return Math.floor(Math.random() * 26) + 5
}

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
    pricePerDay: apiData.priceDay,
    pricePerMonth: apiData.priceMonth,
    deposit: apiData.deposit,
    category: apiData.category,
    region: apiData.state,
    city: apiData.city,
    deliveryMethod: 'A coordinar',
    imageUrl: apiData.photos?.[0]?.url || '',
    isAvailable: apiData.isAvailable,
    rating: generateRating(),
    reviewCount: generateReviewCount(),
    completedRentals: generateCompletedRentals(),
    distance: generateDistance(),
    policies:
      'Depósito mínimo requerido al momento de la reserva. El producto debe devolverse en las mismas condiciones. Se permite hasta 24 horas de gracia para cancelaciones sin cargo.',
    reviews: [],
  }
}
