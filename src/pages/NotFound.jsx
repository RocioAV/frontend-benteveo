import { useNavigate } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <div className="notfound-emoji">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
            <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
          </svg>
        </div>
        <h1>404</h1>
        <p className="notfound-titulo">Pagina no encontrada</p>
        <p className="notfound-desc">
          Lo sentimos, la pagina que buscas no existe o fue movida.
        </p>
        <div className="notfound-acciones">
          <button className="btn-volver" onClick={() => navigate('/')}>
            Volver al inicio
          </button>
          <button className="btn-explorar-404" onClick={() => navigate('/explorar')}>
            Explorar productos
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
