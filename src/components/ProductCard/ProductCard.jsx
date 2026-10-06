import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { formatDistanceLabel, formatProximity, getAvailabilityDays, getProductProximity } from '../../utils/products.js'
import { useFavorites } from '../../context/useFavorites'
import styles from './ProductCard.module.css'

function ProductCard({ product, index = 0, locked = false }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const isFav = isFavorite(product.id)
  const proximityInfo = getProductProximity(product)
  const proximity = proximityInfo.estimated ? null : formatProximity(product.distance)
  const location = proximity || formatDistanceLabel(proximityInfo.distanceKm)
  const availableDays = getAvailabilityDays(product)
  const cardClassName = locked ? `${styles.card} ${styles.cardLocked}` : styles.card

  const cardContent = (
    <>
      <div className={styles.media}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              // Evita bucle: solo se intenta una vez y siempre al placeholder local.
              const img = event.currentTarget
              img.onerror = null
              img.src = '/images/placeholder.svg'
            }}
          />
        ) : (
          <div className={styles.mediaPlaceholder}>
            <i className="fa-solid fa-toolbox" aria-hidden="true" />
          </div>
        )}
        <span className={styles.availability}>{availableDays} días disponibles</span>
        {locked && (
          <div className={styles.lockedOverlay} aria-hidden="true">
            <i className="fa-solid fa-lock" />
          </div>
        )}
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
        {locked && (
          <p className={styles.lockedCopy}>
            <i className="fa-solid fa-lock" aria-hidden="true" />
            <span>Fuera de tu radio</span>
          </p>
        )}
        <div className={styles.footer}>
          <div>
            <span className={styles.price}>${product.pricePerDay.toLocaleString('es-AR')}</span>
            <span className={styles.per}>/día</span>
          </div>
          {Number(product.rating) > 0 && (
            <div className={styles.rating}>
              <i className="fa-solid fa-star" aria-hidden="true" />
              <span>{Number(product.rating).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: (index % 4) * 0.06 }}
      whileHover={locked ? undefined : { y: -6, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      className={`${styles.cardWrap}${locked ? ` ${styles.cardWrapLocked}` : ''}`}
    >
      {locked ? (
        <div role="group" className={cardClassName} aria-disabled="true" aria-label={`${product.title}, fuera de tu radio`}>
          {cardContent}
        </div>
      ) : (
        <Link to={`/detalle/${product.id}`} className={cardClassName}>
          {cardContent}
        </Link>
      )}
      <motion.button
        type="button"
        className={isFav ? `${styles.favBtn} ${styles.favBtnActive}` : styles.favBtn}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-pressed={isFav}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleFavorite(product.id)
        }}
      >
        <i className={isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} aria-hidden="true" />
      </motion.button>
    </motion.div>
  )
}

export default ProductCard
