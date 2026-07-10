import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/BenteveoLogo.webp'
import mockUser from '../data/mockUser.json'
import './header.css'

const Header = ({ onSearch }) => {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value)
    if (onSearch) onSearch(value)
  }

  const handleLogin = () => {
    setUser(mockUser)
    setUserMenuOpen(false)
  }

  const handleLogout = () => {
    setUser(null)
    setUserMenuOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : ''

  return (
    <header className="bv-header">
      <div className="bv-header-left">
        <Link to="/">
          <img className="bv-logo" src={logo} alt="Benteveo" />
        </Link>
        <input
          type="text"
          className="bv-search-bar"
          placeholder="Buscar productos..."
          value={query}
          onChange={handleChange}
        />
      </div>

      <div className="bv-header-slogan">
        <span className="bv-slogan-marca">Gente Comun</span>
        <span className="bv-slogan-tagline">Alquilando cosas comunes</span>
      </div>

      <button
        className="bv-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      <nav>
        <ul className={`bv-social-nav ${menuOpen ? 'bv-open' : ''}`}>
          <li>
            <a href="https://wa.me/TUNUMERO" className="bv-social-link bv-whatsapp" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-whatsapp"></i>
            </a>
          </li>
          <li>
            <a href="https://www.facebook.com/?locale=es_LA" className="bv-social-link bv-facebook" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-facebook"></i>
            </a>
          </li>
          <li>
            <a href="https://www.instagram.com/" className="bv-social-link bv-instagram" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-instagram"></i>
            </a>
          </li>
          <li>
            <a href="https://www.google.com/maps?authuser=0" className="bv-social-link bv-ubicacion" target="_blank" rel="noopener noreferrer">
              <i className="fas fa-map-marker-alt"></i>
            </a>
          </li>
        </ul>
      </nav>

      <div className="bv-auth" ref={userMenuRef}>
        {user ? (
          <>
            <button
              className="bv-user-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <span className="bv-user-avatar">{initials}</span>
              <span className="bv-user-name">{user.name}</span>
              <i className={`fas fa-chevron-${userMenuOpen ? 'up' : 'down'}`}></i>
            </button>

            {userMenuOpen && (
              <div className="bv-user-dropdown">
                <div className="bv-dropdown-header">
                  <span className="bv-dropdown-avatar">{initials}</span>
                  <div>
                    <div className="bv-dropdown-name">{user.name}</div>
                    <div className="bv-dropdown-email">{user.email}</div>
                  </div>
                </div>
                <div className="bv-dropdown-divider"></div>
                <Link to="/profile" className="bv-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <i className="fas fa-user"></i> Mi perfil
                </Link>
                <Link to="/my-rentals" className="bv-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <i className="fas fa-clipboard-list"></i> Mis alquileres
                </Link>
                <Link to="/my-products" className="bv-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <i className="fas fa-box-open"></i> Mis objetos
                </Link>
                <Link to="/favorites" className="bv-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <i className="fas fa-heart"></i> Favoritos
                </Link>
                <div className="bv-dropdown-divider"></div>
                <button className="bv-dropdown-item bv-logout" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Cerrar sesion
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bv-auth-buttons">
            <button className="bv-btn-login" onClick={handleLogin}>
              Iniciar sesion
            </button>
            <button className="bv-btn-register" onClick={handleLogin}>
              Registrarse
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
