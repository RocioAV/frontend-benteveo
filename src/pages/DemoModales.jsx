import { useState } from 'react'
import ReceiveObjectModal from '../components/modals/ReceiveObjectModal'
import RatingModal from '../components/modals/RatingModal'
import RentalCompletionFlow from '../components/modals/RentalCompletionFlow'

function DemoModales() {
  const [showReceive, setShowReceive] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showFlow, setShowFlow] = useState(false)

  const [lastResult, setLastResult] = useState(null)

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontFamily: 'var(--font-title)', marginBottom: '0.5rem' }}>
        Demo — Modales de Alquiler
      </h1>
      <p style={{ color: '#6b6b6b', marginBottom: '2rem' }}>
        Página temporal para probar los modales. Podés eliminar esta página y la ruta de App.jsx cuando la necesites.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          onClick={() => setShowReceive(true)}
          style={{
            padding: '0.875rem 1.25rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Abrir ReceiveObjectModal
        </button>

        <button
          onClick={() => setShowRating(true)}
          style={{
            padding: '0.875rem 1.25rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Abrir RatingModal
        </button>

        <button
          onClick={() => setShowFlow(true)}
          style={{
            padding: '0.875rem 1.25rem',
            background: '#1A1A1A',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Abrir Flujo Completo
        </button>
      </div>

      {lastResult && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
        }}>
          <strong>Último resultado:</strong>
          <pre style={{ margin: '0.5rem 0 0', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      )}

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
    </div>
  )
}

export default DemoModales
