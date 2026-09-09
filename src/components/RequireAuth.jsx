import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

// Gate por estado de sesión (FAS-4): mientras se resuelve la sesión NO se
// redirige; recién con `guest` se navega a /login.
function RequireAuth({ children }) {
  const location = useLocation()
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-24" role="status" aria-label="Cargando">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
      </div>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default RequireAuth
