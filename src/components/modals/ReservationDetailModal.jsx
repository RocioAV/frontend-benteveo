import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import Skeleton from '../Skeleton/Skeleton.jsx'
import { getReservationStep, CANCELLABLE_STATUSES } from '../../utils/reservation-actions.js'
import './ReservationDetailModal.css'

// Ilustración de placeholder dibujada en SVG (se usa cuando la reserva
// todavía no tiene una foto real cargada por el backend).
function TentIllustration() {
  return (
    <svg viewBox="0 0 460 190" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bvrd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C98A4E" />
          <stop offset="100%" stopColor="#DDAE72" />
        </linearGradient>
        <linearGradient id="bvrd-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6E5233" />
          <stop offset="100%" stopColor="#5B4327" />
        </linearGradient>
      </defs>
      <rect width="460" height="190" fill="url(#bvrd-sky)" />
      <circle cx="380" cy="45" r="26" fill="#F6D98C" opacity="0.9" />
      <path d="M0 150 L110 90 L120 100 L60 150 Z" fill="#7C5C39" opacity="0.5" />
      <path d="M460 150 L340 95 L328 105 L400 150 Z" fill="#7C5C39" opacity="0.5" />
      <rect x="0" y="148" width="460" height="42" fill="url(#bvrd-ground)" />
      <path d="M160 150 L230 78 L300 150 Z" fill="#3E4A3D" />
      <path d="M230 78 L230 150 L300 150 Z" fill="#2E3730" />
      <path d="M212 150 L230 108 L248 150 Z" fill="#1C2119" />
      <line x1="230" y1="78" x2="230" y2="150" stroke="#161A14" strokeWidth="2" />
      <line x1="160" y1="150" x2="300" y2="150" stroke="#161A14" strokeWidth="3" />
      <line x1="150" y1="150" x2="163" y2="140" stroke="#8C6A4A" strokeWidth="2" />
      <line x1="310" y1="150" x2="297" y2="140" stroke="#8C6A4A" strokeWidth="2" />
    </svg>
  )
}

function Row({ label, value, className = '' }) {
  return (
    <div className={`bvrd-row ${className}`}>
      <span className="bvrd-label">{label}</span>
      <span className="bvrd-value">{value}</span>
    </div>
  )
}

// Textos de confirmación y feedback por paso bilateral (solo-lectura: el backend
// autoriza cada transición; el modal solo ofrece el paso que corresponde al rol).
const BILATERAL_META = {
  handoff: {
    confirm: '¿Confirmás que entregaste el producto al inquilino?',
    done: 'Entrega marcada. Esperando que el inquilino confirme la recepción.',
    button: 'Confirmar entrega',
  },
  confirmHandoff: {
    confirm: '¿Confirmás que recibiste el producto?',
    done: 'Recepción confirmada. La reserva ya está en curso.',
    button: 'Confirmar recepción',
  },
  return: {
    confirm: '¿Confirmás que devolviste el producto al dueño?',
    done: 'Devolución marcada. Esperando que el dueño confirme la recepción.',
    button: 'Confirmar devolución',
  },
  confirmReturn: {
    confirm: '¿Confirmás que recibiste el producto devuelto?',
    done: 'Recepción confirmada. La reserva quedó completada.',
    button: 'Confirmar recepción final',
  },
}

// `reservation`: objeto ya mapeado con mapReservationToDetail (ver
//   reservationDetail.map.js). `null` mientras carga.
// `viewer`: 'renter' | 'owner' | 'admin' — controla qué acciones se muestran
//   (el backend es quien finalmente autoriza cada transición).
// `readOnly`: modo seguimiento/historial — oculta las acciones bilaterales
//   de entrega/devolución aunque la reserva sea accionable. `cancel` solo se
//   ofrece mientras la reserva no esté en curso (PENDING/CONFIRMED).
// `onAction`: callback async único `onAction(key, reservation)` con
//   key ∈ 'cancel' | 'handoff' | 'confirmHandoff' | 'return' | 'confirmReturn';
//   el modal espera su promesa (éxito → feedback + badge actualizado por la
//   página; error → toast). En modo `readOnly` solo se usa con 'cancel'.
export default function ReservationDetailModal({
  isOpen,
  reservation,
  viewer = 'renter',
  onClose,
  onAction,
  readOnly = false,
}) {
  const [step, setStep] = useState(null) // 'cancel' | bilateral key
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Cargando el detalle (fetch de la reserva por id).
  if (!reservation) {
    return (
      <div className="bvrd-overlay" onClick={onClose}>
        <div className="bvrd-modal" role="dialog" aria-modal="true" aria-label="Cargando detalle de reserva">
          <div className="bvrd-loading">
            <Skeleton rows={4} />
          </div>
        </div>
      </div>
    )
  }

  const status = reservation.status ?? 'Confirmada'
  const isDanger = status === 'Cancelada'
  const canCancel = CANCELLABLE_STATUSES.includes(reservation.statusCode)
  // Paso bilateral visible según rol + estado + timestamps (nunca se saltea).
  // En modo seguimiento (`readOnly`, p. ej. Mis reservas) se suprime aunque
  // la reserva sea accionable: la coordinación vive en Agenda.
  const role = viewer === 'owner' ? 'owner' : viewer === 'renter' ? 'renter' : null
  const bilateral = getReservationStep(
    {
      status: reservation.statusCode,
      actualHandoffAt: reservation.actualHandoffAt,
      renterReceivedAt: reservation.renterReceivedAt,
      renterReturnedAt: reservation.renterReturnedAt,
      actualReturnAt: reservation.actualReturnAt,
    },
    role,
  )
  const bilateralAction = !readOnly && bilateral.kind === 'action' ? bilateral : null

  const handleClose = () => {
    onClose?.()
  }

  const runAction = async () => {
    if (busy || !step) return
    if (readOnly && step !== 'cancel') return
    if (!onAction) return

    setBusy(true)
    try {
      await onAction(step, reservation)
      setFeedback(
        step === 'cancel' ? 'Reserva cancelada.' : (BILATERAL_META[step]?.done ?? 'Acción completada.'),
      )
      setStep(null)
    } catch (err) {
      toast.error(err?.message || 'No se pudo completar la acción.')
    } finally {
      setBusy(false)
    }
  }

  const confirmMessage =
    step === 'cancel'
      ? '¿Seguro que querés cancelar esta reserva?'
      : (BILATERAL_META[step]?.confirm ?? '')

  return (
    <div className="bvrd-overlay" onClick={handleClose}>
      <div
        className="bvrd-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bvrd-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen del objeto */}
        <div className="bvrd-object-media">
          {reservation.image ? (
            <img src={reservation.image} alt={reservation.title} />
          ) : (
            <TentIllustration />
          )}

          <button className="bvrd-close-btn" aria-label="Cerrar" onClick={handleClose}>
            <i className="fas fa-xmark" aria-hidden="true" />
          </button>

          <div className="bvrd-object-tag">
            <div className="bvrd-category">{reservation.category}</div>
            <h2 id="bvrd-modal-title">{reservation.title}</h2>
          </div>
        </div>

        {/* Encabezado con estado y código */}
        <div className="bvrd-modal-header">
          <span className="bvrd-ref">Reserva #{reservation.id}</span>
          <span className={`bvrd-status ${isDanger ? 'bvrd-status--danger' : ''}`}>{status}</span>
        </div>

        {/* Período de alquiler */}
        <div className="bvrd-rental-period">
          <div className="bvrd-period-block">
            <div className="bvrd-label">Retiro</div>
            <div className="bvrd-date">{reservation.pickup}</div>
          </div>
          <div className="bvrd-period-arrow">&rarr;</div>
          <div className="bvrd-period-block">
            <div className="bvrd-label">Devolución</div>
            <div className="bvrd-date">{reservation.dropoff}</div>
          </div>
        </div>
        {reservation.duration ? <div className="bvrd-duration-note">{reservation.duration}</div> : null}

        {/* Cuerpo */}
        <div className="bvrd-modal-body">
          <Row label="Cliente" value={reservation.client} />
          <Row label="Dueño" value={reservation.owner} />
          <Row
            label="Contacto"
            value={
              <>
                <i className="fas fa-phone" aria-hidden="true" />
                {reservation.contact}
              </>
            }
          />
          <Row
            label="Lugar de retiro"
            value={
              <>
                <i className="fas fa-location-dot" aria-hidden="true" />
                {reservation.pickupLocation}
              </>
            }
          />
          <Row label="Depósito de garantía" value={reservation.deposit} />
          <Row label="Total alquiler" value={reservation.total} className="bvrd-row--total" />

          {reservation.note ? (
            <div className="bvrd-notes">
              <strong>Nota de entrega</strong>
              {reservation.note}
            </div>
          ) : null}
        </div>

        {feedback && <div className="bvrd-feedback">{feedback}</div>}

        {/* Acciones / confirmación */}
        {step ? (
          <div className="bvrd-confirm">
            <p className="bvrd-confirm-text">{confirmMessage}</p>
            <div className="bvrd-modal-actions">
              <button
                type="button"
                className="bvrd-btn bvrd-btn--secondary"
                onClick={() => setStep(null)}
                disabled={busy}
              >
                Volver
              </button>
              <button
                type="button"
                className={step === 'cancel' ? 'bvrd-btn bvrd-btn--danger' : 'bvrd-btn bvrd-btn--primary'}
                onClick={runAction}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <i className="fas fa-spinner fa-spin" aria-hidden="true" /> Procesando…
                  </>
                ) : step === 'cancel' ? (
                  'Sí, cancelar'
                ) : (
                  BILATERAL_META[step]?.button ?? 'Confirmar'
                )}
              </button>
            </div>
          </div>
        ) : canCancel || bilateralAction ? (
          <div className="bvrd-modal-actions">
            {canCancel ? (
              <button type="button" className="bvrd-btn-danger-link" onClick={() => setStep('cancel')}>
                <i className="fas fa-ban" aria-hidden="true" /> Cancelar reserva
              </button>
            ) : null}
            {bilateralAction ? (
              <button type="button" className="bvrd-btn bvrd-btn--primary" onClick={() => setStep(bilateralAction.key)}>
                {bilateralAction.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
