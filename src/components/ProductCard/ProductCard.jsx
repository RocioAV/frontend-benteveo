import { useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { formatProximity } from '../../utils/products.js'
import styles from './ProductCard.module.css'

function ProductCard({ product, index = 0 }) {
  const [isFav, setIsFav] = useState(false)
  const proximity = formatProximity(product.distance)
  const location = proximity || `${product.city}, ${product.region}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: (index % 4) * 0.06 }}
      whileHover={{ y: -8, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      className={styles.cardWrap}
    >
      <Link to={`/detalle/${product.id}`} className={styles.card}>
        <div className={styles.media}>
          <img src={product.imageUrl} alt={product.title} loading="lazy" decoding="async" />
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{product.title}</h3>
          <p className={styles.proximity}>
            <svg className={styles.pin} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{location}</span>
          </p>
          <div className={styles.footer}>
            <div>
              <span className={styles.price}>${product.pricePerDay.toLocaleString('es-AR')}</span>
              <span className={styles.per}>/día</span>
            </div>
            {product.rating != null ? (
              <div className={styles.rating}>
                <i className="fa-solid fa-star" aria-hidden="true" />
                <span>{Number(product.rating).toFixed(1)}</span>
              </div>
            ) : (
              <div className={styles.ratingEmpty}>Sin reseñas</div>
            )}
          </div>
        </div>
      </Link>
      <motion.button
        type="button"
        className={isFav ? `${styles.favBtn} ${styles.favBtnActive}` : styles.favBtn}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-pressed={isFav}
        onClick={() => setIsFav((prev) => !prev)}
      >
        <i className={isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} aria-hidden="true" />
      </motion.button>
    </motion.div>
  )
}

export default ProductCard
