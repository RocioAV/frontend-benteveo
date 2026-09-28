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
    return Math.max(1, Math.round((end - start) / MS_PER_DAY))
  } catch {
    return null
  }
}

function money(amount) {
  if (amount === null || amount === undefined) return '—'
  return `$${Number(amount).toLocaleString('es-AR')}`
}

// Convierte una reserva del backend al shape que espera ReservationDetailModal.
//   options.statusLabels: mapa STATUS -> label en español (ej. CONFIRMED -> "Confirmada")
//   options.clientName: nombre de la otra parte a mostrar como "Cliente"
export function mapReservationToDetail(reservation, options = {}) {
  if (!reservation) return null
  const { statusLabels = {}, clientName } = options
  const product = reservation.product ?? {}
  const days = rentalDays(reservation.dateInit, reservation.dateEnd)

  return {
    id: reservation.id,
    category: product.category || 'Alquiler',
    title: product.title || 'Producto',
    image: product.imageUrl || null,
    pickup: formatDay(reservation.dateInit),
    dropoff: formatDay(reservation.dateEnd),
    duration: days ? `${days} ${days === 1 ? 'día' : 'días'} de alquiler` : '',
    client: clientName || reservation.user?.name || '—',
    contact: reservation.contact || '—',
    pickupLocation: reservation.pickupLocation || '—',
    deposit: product.deposit != null ? `${money(product.deposit)} (reembolsable)` : '—',
    total: money(reservation.totalAmount),
    note: reservation.note || '',
    status: statusLabels[reservation.status] ?? reservation.status ?? 'Confirmada',
  }
}
