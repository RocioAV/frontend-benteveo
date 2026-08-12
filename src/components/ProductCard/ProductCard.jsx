import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import styles from './ProductCard.module.css'

function ProductCard({ product, index = 0 }) {
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
          <img src={product.imageUrl} alt={product.title} loading="lazy" />
          <span className={styles.tag}>{product.category}</span>
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{product.title}</h3>
          <p className={styles.desc}>{product.description}</p>
          <p className={styles.meta}>
            <svg className={styles.pin} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{product.city}, {product.region}</span>
          </p>
          <div className={styles.footer}>
            <div>
              <span className={styles.price}>${product.pricePerDay.toLocaleString('es-AR')}</span>
              <span className={styles.per}>/día</span>
            </div>
            <div className={styles.deposit}>
              <span>Seña</span>
              <strong>${product.deposit.toLocaleString('es-AR')}</strong>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default ProductCard
