import React from 'react'
import { Link } from 'react-router-dom'
import './header.css'

const Header = () => {
	return (
		<header className="bv-header">
			<div className="bv-container">
				<div className="bv-logo">
					<Link to="/">Beenteveo</Link>
				</div>
				<nav className="bv-nav">
					<Link to="/">Inicio</Link>
					<Link to="/about">Acerca</Link>
					<Link to="/contact">Contacto</Link>
				</nav>
			</div>
		</header>
	)
}

export default Header

