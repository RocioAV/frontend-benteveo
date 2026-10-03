// Paso bilateral de una reserva según rol, estado y marcas de tiempo.
// Determina qué puede hacer cada participante sin saltear etapas:
//   CONFIRMED: el dueño marca la entrega → el inquilino confirma la recepción → ACTIVE.
//   ACTIVE: el inquilino marca la devolución → el dueño confirma la recepción → COMPLETED.
//   COMPLETED: ambos pueden calificarse mutuamente (ver user-ratings.service.js).
//
// `reservation`: objeto crudo del backend (status + timestamps + userId/product.ownerId).
// `role`: 'owner' | 'renter' — de qué lado se mira la reserva (tab o viewer del modal).
//
// Devuelve:
//   { kind: 'action', key, label } — el participante puede ejecutar `key` ahora.
//   { kind: 'wait', message } — debe esperar a la contraparte.
//   { kind: 'rate' } — reserva COMPLETED: puede calificar a la contraparte.
//   { kind: 'none' } — no hay nada que mostrar (PENDING/CANCELLED/estado desconocido).

export const RESERVATION_ACTION_KEYS = ['handoff', 'confirmHandoff', 'return', 'confirmReturn']

// Estado de calificación entre usuarios por reserva COMPLETED:
//   'checking' — desconocido o verificando (nunca se ofrece Calificar a ciegas)
//   'unrated'  — verificado: puede calificar
//   'rated'    — verificado: ya calificó (conserva el puntaje)
//   'error'    — la verificación falló (reintento vía clic, sin POST duplicado)
export const RATING_STATUSES = ['checking', 'unrated', 'rated', 'error']

// Vista a renderizar para la calificación de una reserva a partir del mapa
// `ratingState` ({ [reservationId]: { status, score } }). Desconocido se trata
// como checking: jamás se muestra un `Calificar` falso.
export function getRatingView(ratingState, reservationId) {
  const entry = ratingState?.[reservationId]
  if (!entry) return { kind: 'checking' }
  if (entry.status === 'rated') return { kind: 'rated', score: entry.score ?? null }
  if (entry.status === 'unrated') return { kind: 'rate' }
  if (entry.status === 'error') return { kind: 'retry' }
  return { kind: 'checking' }
}

// Campos que un PATCH de reserva puede actualizar en las listas locales.
const MUTABLE_RESERVATION_FIELDS = [
  'status',
  'actualHandoffAt',
  'renterReceivedAt',
  'renterReturnedAt',
  'actualReturnAt',
]

// Fusiona una respuesta PATCH sobre la reserva local pisando solo los campos
// presentes (distintos de `undefined`): una respuesta parcial nunca borra
// valores existentes.
export function mergeReservationUpdate(reservation, updated) {
  if (!reservation || !updated) return reservation
  const fields = {}
  for (const key of MUTABLE_RESERVATION_FIELDS) {
    if (updated[key] !== undefined) fields[key] = updated[key]
  }
  return { ...reservation, ...fields }
}

// Fecha operativa más pertinente para Agenda: la entrega (dateInit) en
// CONFIRMED y la devolución (dateEnd) en ACTIVE/COMPLETED.
function agendaRelevantIso(reservation) {
  if (!reservation) return null
  if (reservation.status === 'ACTIVE' || reservation.status === 'COMPLETED') {
    return reservation.dateEnd || reservation.dateInit || null
  }
  return reservation.dateInit || reservation.dateEnd || null
}

function startOfDay(value) {
  const d = value instanceof Date ? new Date(value) : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  return d
}

function agendaSortTime(reservation) {
  const raw = agendaRelevantIso(reservation)
  if (!raw) return Number.POSITIVE_INFINITY
  const time = new Date(raw).getTime()
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

// Fin del alquiler ya pasado: la reserva venció y Agenda deja de mostrarla
// aunque el flujo siga abierto (CONFIRMED/ACTIVE sin confirmar).
function isOverdue(reservation, today) {
  const raw = reservation.dateEnd || reservation.dateInit
  const day = raw ? startOfDay(raw) : null
  return Boolean(day && today && day < today)
}

// Selección pura de reservas visibles en Agenda por rol.
// - CONFIRMED/ACTIVE: visibles mientras `getReservationStep` exprese
//   acción o espera operativa, salvo que el alquiler ya haya vencido
//   (`dateEnd` anterior a hoy): esas se ocultan. Sin paso operativo solo se
//   conserva la CONFIRMED con fecha relevante no anterior a hoy.
// - COMPLETED: visible mientras `getRatingView` no sea `rated` (checking,
//   unrated, retry y desconocido se conservan para no esconder prematuro),
//   aunque el alquiler haya vencido: es el único punto de entrada a calificar.
// - PENDING, CANCELLED y COMPLETED ya calificada quedan excluidas.
// - `now` es inyectable para pruebas; el orden es determinista por fecha
//   operativa ascendente con desempate por id.
export function selectAgendaReservations(reservations, role, ratingState = {}, now = new Date()) {
  if (!Array.isArray(reservations)) return []
  if (role !== 'owner' && role !== 'renter') return []
  const today = startOfDay(now) ?? startOfDay(new Date())

  const visible = []
  for (const reservation of reservations) {
    if (!reservation) continue
    const status = reservation.status
    if (status === 'PENDING' || status === 'CANCELLED') continue

    if (status === 'COMPLETED') {
      if (getRatingView(ratingState, reservation.id).kind === 'rated') continue
      visible.push(reservation)
      continue
    }

    if (status === 'CONFIRMED' || status === 'ACTIVE') {
      if (isOverdue(reservation, today)) continue
      const step = getReservationStep(reservation, role)
      if (step.kind === 'action' || step.kind === 'wait') {
        visible.push(reservation)
        continue
      }
      if (status === 'ACTIVE') {
        visible.push(reservation)
        continue
      }
      const relevant = agendaRelevantIso(reservation)
      const day = relevant ? startOfDay(relevant) : null
      if (day && today && day >= today) visible.push(reservation)
      continue
    }
  }

  visible.sort((a, b) => {
    const diff = agendaSortTime(a) - agendaSortTime(b)
    if (diff !== 0) return diff
    return String(a?.id ?? '').localeCompare(String(b?.id ?? ''))
  })
  return visible
}

export function getReservationStep(reservation, role) {
  if (!reservation || (role !== 'owner' && role !== 'renter')) {
    return { kind: 'none' }
  }

  const status = reservation.status
  const hasHandoff = Boolean(reservation.actualHandoffAt)
  const hasReceipt = Boolean(reservation.renterReceivedAt)
  const hasReturn = Boolean(reservation.renterReturnedAt)
  const hasFinalReceipt = Boolean(reservation.actualReturnAt)

  if (status === 'COMPLETED') {
    return { kind: 'rate' }
  }

  if (status === 'CONFIRMED') {
    if (role === 'owner') {
      if (!hasHandoff) {
        return { kind: 'action', key: 'handoff', label: 'Marcar como entregado' }
      }
      return { kind: 'wait', message: 'Esperando que el inquilino confirme la recepción.' }
    }
    if (!hasHandoff) {
      return { kind: 'wait', message: 'Esperando que el dueño marque la entrega.' }
    }
    if (!hasReceipt) {
      return { kind: 'action', key: 'confirmHandoff', label: 'Confirmar recepción' }
    }
    return { kind: 'wait', message: 'Recepción confirmada. La reserva se activará en breve.' }
  }

  if (status === 'ACTIVE') {
    if (role === 'renter') {
      if (!hasReturn) {
        return { kind: 'action', key: 'return', label: 'Marcar como devuelto' }
      }
      return { kind: 'wait', message: 'Esperando que el dueño confirme la recepción.' }
    }
    if (!hasReturn) {
      return { kind: 'wait', message: 'Esperando que el inquilino marque la devolución.' }
    }
    if (!hasFinalReceipt) {
      return { kind: 'action', key: 'confirmReturn', label: 'Confirmar recepción' }
    }
    return { kind: 'wait', message: 'Recepción confirmada. La reserva se completará en breve.' }
  }

  return { kind: 'none' }
}
