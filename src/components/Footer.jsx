import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import logo from '../assets/BenteveoLogo.webp';

function Footer() {
  return (
    <footer className={styles.bvFooter}>
      <div className={styles.bvFooterContainer}>

        {/* Columna 1: Logo + Descripción */}
        <div className={styles.bvFooterBrand}>
          <Link to="/" className={styles.bvFooterLogoLink}>
            <img src={logo} alt="Benteveo" className={styles.bvFooterLogo} />
          </Link>
          <p className={styles.bvFooterTagline}>
            Alquiler de herramientas y equipamiento. Fácil, rápido y cerca tuyo.
          </p>
          <div className={styles.bvFooterSocials}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.bvFooterSocialLink}>
              <i className="fab fa-instagram" aria-hidden="true"></i>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={styles.bvFooterSocialLink}>
              <i className="fab fa-facebook-f" aria-hidden="true"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className={styles.bvFooterSocialLink}>
              <i className="fab fa-twitter" aria-hidden="true"></i>
            </a>
            <a href="https://wa.me/5491112345678" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={styles.bvFooterSocialLink}>
              <i className="fab fa-whatsapp" aria-hidden="true"></i>
            </a>
          </div>
        </div>

        {/* Columna 2: Sobre Nosotros */}
        <div className={styles.bvFooterCol}>
          <h4 className={styles.bvFooterHeading}>Sobre nosotros</h4>
          <ul className={styles.bvFooterList}>
            <li><Link to="/explorar" className={styles.bvFooterLink}>Catálogo</Link></li>
            <li><a href="#" className={styles.bvFooterLink}>Preguntas frecuentes</a></li>
            <li><a href="#" className={styles.bvFooterLink}>Términos y condiciones</a></li>
          </ul>
        </div>

        {/* Columna 3: Contacto */}
        <div className={styles.bvFooterCol}>
          <h4 className={styles.bvFooterHeading}>Contacto</h4>
          <ul className={styles.bvFooterList}>
            <li className={styles.bvFooterContactItem}>
              <i className="fas fa-phone-alt" aria-hidden="true"></i>
              <a href="tel:+5491112345678">+54 9 11 1234-5678</a>
            </li>
            <li className={styles.bvFooterContactItem}>
              <i className="fas fa-envelope" aria-hidden="true"></i>
              <a href="mailto:info@benteveo.com">info@benteveo.com</a>
            </li>
            <li className={styles.bvFooterContactItem}>
              <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
              <span>Buenos Aires, Argentina</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Barra inferior */}
      <div className={styles.bvFooterBottom}>
        <p>&copy; {new Date().getFullYear()} Benteveo. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;