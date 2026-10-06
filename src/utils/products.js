// Utilidades compartidas de productos: distancia, proximidad y búsqueda.

export const PROXIMITY_RADIUS_KM = 1

const ESTIMATED_DISTANCE_OPTIONS = [0.4, 0.7, 0.9, 1.3, 1.8, 2.4]

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
  if (typeof distance === 'number') return Number.isFinite(distance) && distance >= 0 ? distance : null
  if (typeof distance !== 'string') return null
  const match = distance.replace(',', '.').match(/\d+(?:\.\d+)?/)
  const n = match ? Number(match[0]) : NaN
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

// true si la distancia conocida está dentro del radio configurado.
export function isWithinRange(distance, maxKm = PROXIMITY_RADIUS_KM) {
  const km = parseDistance(distance)
  return km !== null && km <= maxKm
}

function getStableHash(value) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

// El backend todavía no expone coordenadas para calcular la distancia real.
// Este fallback sólo hace visible el flujo de demo y siempre produce el mismo resultado.
export function getEstimatedDistance(product) {
  const key = `${product?.id ?? ''}:${product?.title ?? ''}`
  const index = getStableHash(key) % ESTIMATED_DISTANCE_OPTIONS.length
  return ESTIMATED_DISTANCE_OPTIONS[index]
}

export function getProductProximity(product, maxKm = PROXIMITY_RADIUS_KM) {
  const parsedDistance = parseDistance(product?.distance)
  const distanceKm = parsedDistance ?? getEstimatedDistance(product)

  return {
    distanceKm,
    estimated: parsedDistance === null,
    withinRadius: distanceKm <= maxKm,
  }
}

export function formatDistanceLabel(distanceKm) {
  const formattedDistance = Number(distanceKm).toLocaleString('es-AR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })
  return `Distancia: ${formattedDistance} km`
}

// true si el producto matchea la query (título, categoría o ciudad, sin acentos).
export function matchesQuery(product, query) {
  const nq = normalizeText(query).trim()
  if (nq === '') return true
  const haystack = normalizeText(`${product.title} ${product.category} ${product.city}`)
  return haystack.includes(nq)
}

// Días disponibles para alquiler (simulado hasta que exista data real de calendario).
// Determinístico por producto: 3 a 7 días. Soporta ids numéricos y UUID (strings).
export function getAvailabilityDays(product) {
  const raw = product?.id
  const key = typeof raw === 'number' ? String(raw) : String(raw ?? '')
  if (key === '') return 3
  // Hash estable (FNV-1a) para que un UUID produzca siempre el mismo resultado.
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return 3 + (hash % 5)
}
