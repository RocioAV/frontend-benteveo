import './reservation.css'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import products from '../data/products.json'

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

// Costo de entrega a domicilio (placeholder — reemplazar por lógica real de envío).
const DELIVERY_FEE = 1500

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

// Fechas no disponibles (simuladas) hasta que exista data real de reservas ocupadas.
function isUnavailable(date, productId) {
  const n = date.getDate() + date.getMonth() + productId
  return n % 7 === 0 || n % 11 === 0
}

function Reservation({ product: productProp }) {
  const { id } = useParams()
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [delivery, setDelivery] = useState('retiro')
  const [submission, setSubmission] = useState(null)

  const product = productProp ?? products.find((p) => p.id === Number(id))
  if (!product) {
    return <h1>Producto no encontrado</h1>
  }

  const today = startOfDay(new Date())

  const daysOfRent =
    startDate && endDate && endDate >= startDate
      ? Math.round((endDate - startDate) / MS_PER_DAY) + 1
      : 0
  const subtotal = daysOfRent * product.pricePerDay
  const deliveryCost = delivery === 'domicilio' ? DELIVERY_FEE : 0
  const total = subtotal + deliveryCost

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
    if (norm < today || isUnavailable(norm, product.id)) return
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

  const inRange = (d) => startDate && endDate && d > startDate && d < endDate

  const formatLong = (d) =>
    d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setSubmission('error')
      return
    }
    localStorage.setItem(
      'bv:reservation',
      JSON.stringify({
        productId: product.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        delivery,
      })
    )
    setSubmission('success')
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
                const disabled = norm < today || isUnavailable(norm, product.id)
                const isStart = startDate && norm.getTime() === startDate.getTime()
                const isEnd = endDate && norm.getTime() === endDate.getTime()
                return (
                  <button
                    key={norm.toISOString()}
                    type="button"
                    className={[
                      'calendar__day',
                      disabled ? 'calendar__day--disabled' : '',
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
          <fieldset className="delivery">
            <legend>Método de entrega</legend>
            <label className={`delivery__option ${delivery === 'domicilio' ? 'delivery__option--active' : ''}`}>
              <input
                type="radio"
                name="delivery"
                value="domicilio"
                checked={delivery === 'domicilio'}
                onChange={() => setDelivery('domicilio')}
              />
              <span className="delivery__body">
                <strong>Entrega a domicilio</strong>
                <small>Costo adicional ${DELIVERY_FEE.toLocaleString('es-AR')}</small>
              </span>
            </label>
            <label className={`delivery__option ${delivery === 'retiro' ? 'delivery__option--active' : ''}`}>
              <input
                type="radio"
                name="delivery"
                value="retiro"
                checked={delivery === 'retiro'}
                onChange={() => setDelivery('retiro')}
              />
              <span className="delivery__body">
                <strong>Retiro en el domicilio del propietario</strong>
                <small>Sin costo</small>
              </span>
            </label>
          </fieldset>

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
            <p>
              <span>Entrega</span>
              <strong>
                {deliveryCost === 0 ? 'Gratis' : `$${deliveryCost.toLocaleString('es-AR')}`}
              </strong>
            </p>
            <p className="reservation-summary__total">
              <span>Total</span>
              <strong>${total.toLocaleString('es-AR')}</strong>
            </p>
          </div>

          {/* Botón */}
          <motion.button type="submit" className="reservation-submit" whileTap={{ scale: 0.96 }} transition={springLatch}>
            Alquilar ahora
          </motion.button>
          <p className="reservation-secure">
            <i className="fas fa-lock" aria-hidden="true" /> Pago seguro · Sin costo de cancelación
          </p>

          {submission === 'error' && (
            <motion.p className="reservation-error" role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
              Seleccioná las fechas de tu alquiler para continuar.
            </motion.p>
          )}
          {submission === 'success' && (
            <motion.p className="reservation-success" role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
              ¡Reserva confirmada! Del {formatLong(startDate)} al {formatLong(endDate)}.
            </motion.p>
          )}
        </motion.form>
      </section>
    </MotionConfig>
  )
}

export default Reservation
