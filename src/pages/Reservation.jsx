import './reservation.css'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import Skeleton from '../components/Skeleton/Skeleton.jsx'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import { fetchProduct } from '../services/products.service.js'
import { useAuth } from '../context/useAuth'
import VerificationModal from '../components/VerificationModal/VerificationModal.jsx'
import PaymentModal from '../components/modals/PaymentModal.jsx'

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MS_PER_DAY = 1000 * 60 * 60 * 24

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function Reservation({ product: productProp }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, status: sessionStatus } = useAuth()

  const [product, setProduct] = useState(productProp ?? null)
  const [status, setStatus] = useState(productProp ? 'ready' : 'loading')

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentData, setPaymentData] = useState(null)

  // Si llega como prop (desde DetalleProducto), no se fetchea: el estado inicial
  // ya viene listo. Si se monta por la ruta /reservation/:id, se busca el producto
  // por su UUID.
  useEffect(() => {
    if (productProp) return undefined

    let cancelled = false
    fetchProduct(id)
      .then((data) => {
        if (cancelled) return
        setProduct(data)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [id, productProp])

  if (status === 'loading') {
    return (
      <section className="reservation-page" aria-label="Cargando reserva">
        <div className="reservation-card">
          <Skeleton rows={5} />
        </div>
      </section>
    )
  }

  if (status === 'error' || !product) {
    return (
      <MotionConfig reducedMotion="user">
        <section className="reservation-page" aria-label="Error al cargar producto">
          <EmptyState
            message="No pudimos cargar el producto para reservar."
            actionLabel="Volver al catálogo"
            onAction={() => navigate('/explorar')}
          />
        </section>
      </MotionConfig>
    )
  }

  const today = startOfDay(new Date())

  const isLoggedIn = sessionStatus === 'authed'
  const isVerified = user?.isIdentityVerified === true
  const blockedByVerification = isLoggedIn && !isVerified

  const daysOfRent =
    startDate && endDate && endDate >= startDate
      ? Math.round((endDate - startDate) / MS_PER_DAY)
      : 0
  const subtotal = daysOfRent * product.pricePerDay
  const deposit = Number(product.deposit) || 0
  const total = subtotal + deposit

  const prevMonth = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  const firstWeekday = (new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay() + 6) % 7
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()

  const calendarCells = []
  for (let i = 0; i < firstWeekday; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d))
  }

  const handleSelectDate = (date) => {
    const norm = startOfDay(date)
    if (norm < today) return
    if (isBooked(norm)) return
    if (!startDate || (startDate && endDate)) {
      setStartDate(norm)
      setEndDate(null)
    } else if (norm >= startDate) {
      setEndDate(norm)
    } else {
      setStartDate(norm)
      setEndDate(null)
    }
  }

  const isBooked = (date) => {
    if (!product?.reservations) return false
    return product.reservations.some((r) => {
      const from = startOfDay(new Date(r.dateInit))
      const to = startOfDay(new Date(r.dateEnd))
      return date >= from && date <= to
    })
  }

  const inRange = (d) => startDate && endDate && d > startDate && d < endDate

  const formatLong = (d) =>
    d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setSubmission('error')
      return
    }

    setPaymentData({
      productId: product.id,
      dateInit: startDate.toISOString(),
      dateEnd: endDate.toISOString(),
      titulo: product.title,
      precio: product.pricePerDay,
      deposit: Number(product.deposit) || 0,
      dias: daysOfRent,
    })
    setPaymentOpen(true)
  }

  return (
    <MotionConfig reducedMotion="user">
      <section className="reservation-page">
        <motion.form
          className="reservation-card"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springReveal}
        >
          {/* Precio por día */}
          <div className="reservation-price">
            <span className="reservation-price__value">
              ${product.pricePerDay.toLocaleString('es-AR')}
            </span>
            <span className="reservation-price__label">por día</span>
          </div>

          {/* Calendario */}
          <div className="calendar">
            <div className="calendar__header">
              <button type="button" onClick={prevMonth} aria-label="Mes anterior">
                <i className="fas fa-chevron-left" aria-hidden="true" />
              </button>
              <span className="calendar__title">
                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </span>
              <button type="button" onClick={nextMonth} aria-label="Mes siguiente">
                <i className="fas fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
            <div className="calendar__weekdays">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="calendar__grid">
              {calendarCells.map((date, i) => {
                if (!date) return <span key={`b-${i}`} className="calendar__day calendar__day--blank" />
                const norm = startOfDay(date)
                const booked = isBooked(norm)
                const disabled = norm < today || booked
                const isStart = startDate && norm.getTime() === startDate.getTime()
                const isEnd = endDate && norm.getTime() === endDate.getTime()
                return (
                  <button
                    key={norm.toISOString()}
                    type="button"
                    className={[
                      'calendar__day',
                      disabled ? 'calendar__day--disabled' : '',
                      booked ? 'calendar__day--booked' : '',
                      isStart ? 'calendar__day--start' : '',
                      isEnd ? 'calendar__day--end' : '',
                      inRange(norm) ? 'calendar__day--range' : '',
                    ].join(' ').trim()}
                    disabled={disabled}
                    onClick={() => handleSelectDate(norm)}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rango seleccionado */}
          {(startDate || endDate) && (
            <div className="reservation-range">
              <span>
                {startDate ? `Desde el ${formatLong(startDate)}` : 'Elegí la fecha de inicio'}
              </span>
              <span>{endDate ? `Hasta el ${formatLong(endDate)}` : '—'}</span>
            </div>
          )}

          {/* Método de entrega */}
          <div className="delivery delivery--info">
            <p className="delivery__info-text">
              <i className="fas fa-truck" aria-hidden="true" />
              La entrega se coordina con el propietario. El retiro es sin costo.
            </p>
          </div>

          {/* Resumen */}
          <div className="reservation-summary">
            <p>
              <span>
                {daysOfRent > 0
                  ? `${daysOfRent} ${daysOfRent === 1 ? 'día' : 'días'} × $${product.pricePerDay.toLocaleString('es-AR')}`
                  : 'Seleccioná las fechas'}
              </span>
              <strong>${subtotal.toLocaleString('es-AR')}</strong>
            </p>
            {deposit > 0 && (
              <p>
                <span>Depósito en garantía</span>
                <strong>${deposit.toLocaleString('es-AR')}</strong>
              </p>
            )}
            <p>
              <span>Entrega</span>
              <strong>A coordinar</strong>
            </p>
            <p className="reservation-summary__total">
              <span>Total</span>
              <strong>${total.toLocaleString('es-AR')}</strong>
            </p>
          </div>

          {/* Botón */}
          {blockedByVerification && (
            <div className="reservation-notice" role="status">
              <i className="fas fa-shield-halved" aria-hidden="true" /> Verificá tu identidad (DNI) para poder reservar.
              <button type="button" className="reservation-verify-btn" onClick={() => setVerificationOpen(true)}>
                Verificar identidad
              </button>
            </div>
          )}
          <motion.button
            type="submit"
            className="reservation-submit"
            whileTap={{ scale: 0.96 }}
            transition={springLatch}
            disabled={blockedByVerification}
          >
            Continuar al pago
          </motion.button>
          <p className="reservation-secure">
            <i className="fas fa-lock" aria-hidden="true" /> Pago seguro · Sin costo de cancelación
          </p>

          {submission === 'error' && (
            <motion.p className="reservation-error" role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
              Seleccioná las fechas de tu alquiler para continuar.
            </motion.p>
          )}
        </motion.form>
      </section>

      <VerificationModal open={verificationOpen} onClose={() => setVerificationOpen(false)} />
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        reservation={paymentData}
      />
    </MotionConfig>
  )
}

export default Reservation
