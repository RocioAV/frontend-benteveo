import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import logo from '../assets/BenteveoLogo.webp'

import styles from './Header.module.css'

const Header = ({ query = '', onSearch }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    if (onSearch) onSearch(e.target.value)
  }

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <header className={styles.bvHeader}>
      <div className={styles.bvTop}>
        <Link to="/" className={styles.bvLogoLink}>
          <img className={styles.bvLogo} src={logo} alt="Benteveo" />
        </Link>

        <button
          className={styles.bvHamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} aria-hidden="true"></i>
        </button>

        <nav
          id="main-nav"
          aria-label="Menú principal"
          className={`${styles.bvNavbar} ${menuOpen ? styles.bvOpen : ''}`}
        >
          <Link to="/explorar" className={styles.bvNavLink} onClick={() => setMenuOpen(false)}>
            <i className="fas fa-compass" aria-hidden="true"></i> Explorar
          </Link>

          {!user && (
            <button className={styles.bvNavLink} onClick={() => { navigate('/login'); setMenuOpen(false) }}>
              <i className="fas fa-sign-in-alt" aria-hidden="true"></i> Iniciar sesión
            </button>
          )}

          {!user && (
            <button className={styles.bvNavLink} onClick={() => { navigate('/register'); setMenuOpen(false) }}>
              <i className="fas fa-user-plus" aria-hidden="true"></i> Registrarte
            </button>
          )}

          {user && (
            <button className={styles.bvNavLink} onClick={handleLogout}>
              <i className="fas fa-sign-out-alt" aria-hidden="true"></i> Salir
            </button>
          )}
        </nav>
      </div>

      <div className={styles.bvSearchRow}>
        <i className="fas fa-search" aria-hidden="true"></i>
        <input
          type="text"
          className={styles.bvSearchBar}
          placeholder="Buscar productos..."
          aria-label="Buscar productos"
          value={query}
          onChange={handleChange}
        />
      </div>
    </header>
  )
}

export default Header
