import { fetchReservation } from '../../services/reservations.service.js'
import { fetchProduct, fetchPublicProfile } from '../../services/products.service.js'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function formatDay(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

function rentalDays(dateInit, dateEnd) {
  try {
    const start = new Date(dateInit)
    const end = new Date(dateEnd)
    return Math.max(1, Math.ceil((end - start) / MS_PER_DAY))
  } catch {
    return null
  }
}

function money(amount) {
  if (amount === null || amount === undefined) return '—'
  return `$${Number(amount).toLocaleString('es-AR')}`
}

// Lugar de retiro: la dirección real del producto (address + zona/ciudad).
function pickupLocation(product) {
  const parts = [product.address, product.zone || product.city].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

// Total calculado como fallback cuando la reserva no lo tiene guardado:
// priceDay × días (ceil) + depósito — misma fórmula que usa el backend.
function computedTotal(product, dateInit, dateEnd) {
  const price = Number(product?.pricePerDay)
  if (!Number.isFinite(price)) return null
  try {
    const days = Math.max(1, Math.ceil((new Date(dateEnd) - new Date(dateInit)) / MS_PER_DAY))
    const deposit = Number(product?.deposit) || 0
    return money(price * days + deposit)
  } catch {
    return null
  }
}

// Convierte una reserva del backend al shape que espera ReservationDetailModal.
//   options.statusLabels: mapa STATUS -> label en español (ej. CONFIRMED -> "Confirmada")
//   options.clientName: nombre del inquilino a mostrar como "Cliente"
//   options.ownerName: nombre del dueño del producto
//   options.product: detalle del producto (GET /products/:id) — aporta la foto
export function mapReservationToDetail(reservation, options = {}) {
  if (!reservation) return null
  const { statusLabels = {}, clientName, ownerName, product: productDetail } = options
  const product = reservation.product ?? {}
  const days = rentalDays(reservation.dateInit, reservation.dateEnd)

  return {
    id: reservation.id,
    statusCode: reservation.status,
    // Marcas del flujo bilateral (el modal deriva la acción visible con
    // `getReservationStep` según rol + estado + timestamps).
    actualHandoffAt: reservation.actualHandoffAt ?? null,
    renterReceivedAt: reservation.renterReceivedAt ?? null,
    renterReturnedAt: reservation.renterReturnedAt ?? null,
    actualReturnAt: reservation.actualReturnAt ?? null,
    category: product.category || 'Alquiler',
    title: product.title || 'Producto',
    image: productDetail?.imageUrl ?? product.imageUrl ?? null,
    pickup: formatDay(reservation.dateInit),
    dropoff: formatDay(reservation.dateEnd),
    dateInit: reservation.dateInit,
    duration: days ? `${days} ${days === 1 ? 'día' : 'días'} de alquiler` : '',
    client: clientName || reservation.user?.name || '—',
    owner: ownerName || '—',
    contact: reservation.contact || '—',
    pickupLocation: pickupLocation(product),
    deposit: product.deposit != null ? `${money(product.deposit)} (reembolsable)` : '—',
    total:
      reservation.totalAmount != null
        ? money(reservation.totalAmount)
        : computedTotal(product, reservation.dateInit, reservation.dateEnd) || '—',
    note: reservation.handoffNotes || '',
    status: statusLabels[reservation.status] ?? reservation.status ?? 'Confirmada',
  }
}

// Trae la reserva (por id) junto con la foto del producto y el nombre del
// dueño — datos que las respuestas de reservas no incluyen. Si el producto o
// el dueño no se pueden cargar, devuelve el modal con fallbacks.
export async function fetchReservationDetail(id, options = {}) {
  const raw = await fetchReservation(id)
  const productId = raw.product?.id
  const ownerId = raw.product?.ownerId

  const [product, owner] = await Promise.all([
    productId ? fetchProduct(productId).catch(() => null) : Promise.resolve(null),
    ownerId ? fetchPublicProfile(ownerId).catch(() => null) : Promise.resolve(null),
  ])

  return mapReservationToDetail(raw, {
    ...options,
    ownerName: options.ownerName ?? owner?.name ?? null,
    product,
  })
}
