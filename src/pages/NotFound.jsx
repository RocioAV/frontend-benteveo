import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/explorar?q=${encodeURIComponent(search.trim())}`)
    }
  }

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

        <form className="notfound-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        <div className="notfound-links">
          <p className="notfound-links-title">O proba con estos links:</p>
          <div className="notfound-links-list">
            <button onClick={() => navigate('/')}>Inicio</button>
            <button onClick={() => navigate('/explorar')}>Explorar</button>
            <button onClick={() => navigate('/publicar')}>Publicar</button>
            <button onClick={() => navigate('/login')}>Iniciar sesion</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
