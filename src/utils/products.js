// Utilidades compartidas de productos: distancia, proximidad y búsqueda.

// Normaliza texto para búsqueda insensible a mayúsculas y acentos
// ("electronica" matchea "Electrónica", "jardineria" matchea "Jardinería").
export function normalizeText(str) {
  return String(str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// "2.3 km" / "0,8 km" -> 2.3 / 0.8. Devuelve null si no hay distancia válida.
export function parseDistance(distance) {
  if (typeof distance !== 'string') return null
  const n = parseFloat(distance.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// "0.8 km" -> "A 8 cuadras de distancia" · "2.3 km" -> "A 23 cuadras de distancia"
// Siempre en cuadras (1 km ≈ 10 cuadras) — frase de marca "A X cuadras de distancia".
export function formatProximity(distance) {
  const km = parseDistance(distance)
  if (km === null) return null
  const cuadras = Math.max(1, Math.round(km * 10))
  return `A ${cuadras} ${cuadras === 1 ? 'cuadra' : 'cuadras'} de distancia`
}

// true si el producto está dentro del rango (o si la distancia es desconocida).
export function isWithinRange(distance, maxKm = 10) {
  const km = parseDistance(distance)
  return km === null || km <= maxKm
}

// true si el producto matchea la query (título, categoría o ciudad, sin acentos).
export function matchesQuery(product, query) {
  const nq = normalizeText(query).trim()
  if (nq === '') return true
  const haystack = normalizeText(`${product.title} ${product.category} ${product.city}`)
  return haystack.includes(nq)
}
