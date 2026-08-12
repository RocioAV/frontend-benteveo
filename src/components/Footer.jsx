import { Link } from 'react-router-dom';
import '../components/footer.css';
import logo from '../assets/BenteveoLogo.webp';

function Footer() {
  return (
    <footer className="bv-footer">
      <div className="bv-footer__container">

        {/* Columna 1: Logo + Descripción */}
        <div className="bv-footer__brand">
          <Link to="/" className="bv-footer__logo-link ">
            <img src={logo} alt="Benteveo" className="bv-footer__logo" />
          </Link>
          <p className="bv-footer__tagline">
            Alquiler de herramientas y equipamiento. Fácil, rápido y cerca tuyo.
          </p>
          <div className="bv-footer__socials">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="bv-footer__social-link">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="bv-footer__social-link">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className="bv-footer__social-link">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://wa.me/5491112345678" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="bv-footer__social-link">
              <i className="fab fa-whatsapp"></i>
            </a>
          </div>
        </div>

        {/* Columna 2: Sobre Nosotros */}
        <div className="bv-footer__col">
          <h4 className="bv-footer__heading">Sobre nosotros</h4>
          <ul className="bv-footer__list">
            <li><Link to="/catalogo" className="bv-footer__link">Catálogo</Link></li>
            <li><Link to="/reservar" className="bv-footer__link">Reservar</Link></li>
            <li><a href="#" className="bv-footer__link">Preguntas frecuentes</a></li>
            <li><a href="#" className="bv-footer__link">Términos y condiciones</a></li>
          </ul>
        </div>

        {/* Columna 3: Contacto */}
        <div className="bv-footer__col">
          <h4 className="bv-footer__heading">Contacto</h4>
          <ul className="bv-footer__list">
            <li className="bv-footer__contact-item">
              <i className="fas fa-phone-alt"></i>
              <a href="tel:+5491112345678">+54 9 11 1234-5678</a>
            </li>
            <li className="bv-footer__contact-item">
              <i className="fas fa-envelope"></i>
              <a href="mailto:info@benteveo.com">info@benteveo.com</a>
            </li>
            <li className="bv-footer__contact-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>Buenos Aires, Argentina</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Barra inferior */}
      <div className="bv-footer__bottom">
        <p>&copy; {new Date().getFullYear()} Benteveo. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
