import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import logo from '../assets/BenteveoLogo.webp'

import './header.css'

const Header = ({ onSearch }) => {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value)
    if (onSearch) onSearch(value)
  }

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="bv-header">
      <Link to="/" className="bv-logo-link">
        <img className="bv-logo" src={logo} alt="Benteveo" />
      </Link>

      <input
        type="text"
        className="bv-search-bar"
        placeholder="Buscar productos..."
        value={query}
        onChange={handleChange}
      />

      <button
        className="bv-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      <nav className={`bv-navbar ${menuOpen ? 'bv-open' : ''}`}>
        <Link to="/explorar" className="bv-nav-link" onClick={() => setMenuOpen(false)}>
          <i className="fas fa-compass"></i> Explorar
        </Link>

        {user && (
          <Link to="/publish" className="bv-nav-link" onClick={() => setMenuOpen(false)}>
            <i className="fas fa-plus-circle"></i> Publica
          </Link>
        )}

        {user && (
          <Link to="/profile" className="bv-nav-link" onClick={() => setMenuOpen(false)}>
            <i className="fas fa-user"></i> Mi perfil
          </Link>
        )}

        {user && (
          <Link to="/my-rentals" className="bv-nav-link" onClick={() => setMenuOpen(false)}>
            <i className="fas fa-clipboard-list"></i> Mis alquileres
          </Link>
        )}

        {!user && (
          <button className="bv-nav-link bv-nav-btn" onClick={() => { navigate('/login'); setMenuOpen(false) }}>
            <i className="fas fa-sign-in-alt"></i> Iniciar sesión
          </button>
        )}

        {!user && (
          <button className="bv-nav-link bv-nav-btn-register" onClick={() => { navigate('/register'); setMenuOpen(false) }}>
            <i className="fas fa-user-plus"></i> Registrarte
          </button>
        )}

        {user && (
          <button className="bv-nav-link bv-nav-btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Salir
          </button>
        )}
      </nav>
    </header>
  )
}

export default Header
