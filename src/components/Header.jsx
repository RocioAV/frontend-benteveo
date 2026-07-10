import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/BenteveoLogo.png'
import './header.css'

const Header = ({ onSearch }) => {
  const [query, setQuery] = useState('')

  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value)
    if (onSearch) onSearch(value)
  }

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

      <nav>
        <ul className="bv-social-nav">
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
    </header>
  )
}

export default Header
