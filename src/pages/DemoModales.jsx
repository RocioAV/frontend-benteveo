import { useState } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'
import ReceiveObjectModal from '../components/modals/ReceiveObjectModal'
import RatingModal from '../components/modals/RatingModal'
import RentalCompletionFlow from '../components/modals/RentalCompletionFlow'

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

const buttonBase = {
  padding: '0.875rem 1.25rem',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
}

function DemoModales() {
  const [showReceive, setShowReceive] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showFlow, setShowFlow] = useState(false)

  const [lastResult, setLastResult] = useState(null)

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springReveal}
      >
        <h1 style={{ fontFamily: 'var(--font-title)', marginBottom: '0.5rem' }}>
          Demo — Modales de Alquiler
        </h1>
        <p style={{ color: 'var(--color-concrete)', marginBottom: '2rem' }}>
          Página temporal para probar los modales. Podés eliminar esta página y la ruta de App.jsx cuando la necesites.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.button
            onClick={() => setShowReceive(true)}
            whileTap={{ scale: 0.96 }}
            transition={springLatch}
            style={{
              ...buttonBase,
              background: 'var(--color-primary)',
              color: 'var(--color-dark)',
            }}
          >
            Abrir ReceiveObjectModal
          </motion.button>

          <motion.button
            onClick={() => setShowRating(true)}
            whileTap={{ scale: 0.96 }}
            transition={springLatch}
            style={{
              ...buttonBase,
              background: 'var(--color-primary)',
              color: 'var(--color-dark)',
            }}
          >
            Abrir RatingModal
          </motion.button>

          <motion.button
            onClick={() => setShowFlow(true)}
            whileTap={{ scale: 0.96 }}
            transition={springLatch}
            style={{
              ...buttonBase,
              background: 'var(--color-dark)',
              color: 'var(--color-surface)',
            }}
          >
            Abrir Flujo Completo
          </motion.button>
        </div>

        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={springReveal}
              style={{
                marginTop: '2rem',
                padding: '1rem',
                background: 'var(--color-concrete-surface)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
              }}
            >
              <strong>Último resultado:</strong>
              <pre style={{ margin: '0.5rem 0 0', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        <ReceiveObjectModal
          isOpen={showReceive}
          onClose={() => setShowReceive(false)}
          onConfirm={() => {
            setShowReceive(false)
            setLastResult({ action: 'received' })
          }}
          objectName="Taladro Bosch"
          action="received"
        />

        <RatingModal
          isOpen={showRating}
          onClose={() => setShowRating(false)}
          onSubmit={(data) => {
            setShowRating(false)
            setLastResult(data)
          }}
          objectName="Taladro Bosch"
        />

        <RentalCompletionFlow
          isOpen={showFlow}
          objectName="Taladro Bosch"
          action="received"
          onCompleted={(result) => {
            setShowFlow(false)
            setLastResult(result)
          }}
        />
      </motion.div>
    </MotionConfig>
  )
}

export default DemoModales
