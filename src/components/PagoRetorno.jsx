import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { syncPayment } from '../services/payments.service.js'
import styles from './PagoRetorno.module.css'

// Pantalla de retorno desde Mercado Pago (back_urls). Muestran el resultado,
// sincronizan el pago con el backend y redirigen al perfil con un countdown.
const VARIANTS = {
  success: {
    icon: 'fa-circle-check',
    title: 'Pago exitoso',
    description: 'Tu pago fue aprobado. Tu reserva ya aparece como confirmada en tu perfil.',
    tone: 'success',
  },
  failure: {
    icon: 'fa-circle-xmark',
    title: 'No se pudo procesar el pago',
    description: 'El pago no fue aprobado. Podés revisar tu perfil e intentarlo de nuevo.',
    tone: 'failure',
  },
  pending: {
    icon: 'fa-clock',
    title: 'Pago en proceso',
    description:
      'Estamos esperando la confirmación del pago. Vas a ver el estado en tu perfil.',
    tone: 'pending',
  },
}

const REDIRECT_SECONDS = 3

function PagoRetorno({ type }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const variant = VARIANTS[type] ?? VARIANTS.success
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)

  // Mercado Pago agrega external_reference (= id del pago en la BD) a las
  // back_urls. Sincroniza de inmediato: si el webhook no llegó, este request
  // es el que deja el pago APPROVED y la reserva CONFIRMED.
  const paymentRef = searchParams.get('external_reference')

  useEffect(() => {
    if (!paymentRef) return
    syncPayment(paymentRef).catch(() => {
      // Mejor esfuerzo: si falla, el webhook de MP sigue siendo la vía principal.
    })
  }, [paymentRef])

  useEffect(() => {
    if (secondsLeft <= 0) {
      navigate('/dashboard', { replace: true })
      return undefined
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, navigate])

  return (
    <motion.section
      className={styles.retorno}
      aria-live="polite"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <span
        className={`${styles.icon} ${styles[variant.tone]}`}
        aria-hidden="true"
      >
        <i className={`fas ${variant.icon}`} />
      </span>
      <h1 className={styles.title}>{variant.title}</h1>
      <p className={styles.description}>{variant.description}</p>
      <motion.div
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <button
          type="button"
          className={styles.link}
          onClick={() => navigate('/dashboard')}
        >
          Ir a mi perfil
        </button>
      </motion.div>
      <p className={styles.countdown}>
        {secondsLeft > 0
          ? `Serás redirigido en ${secondsLeft} segundo${secondsLeft === 1 ? '' : 's'}…`
          : 'Redirigiendo…'}
      </p>
    </motion.section>
  )
}

export default PagoRetorno
