import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import BenteveoBird from '../components/BenteveoBird'
import styles from './NotFound.module.css'

function NotFound() {
  return (
    <motion.section
      className={styles.notFound}
      aria-labelledby="not-found-titulo"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <BenteveoBird className={styles.bird} />
      <h1 id="not-found-titulo" className={styles.title}>
        Página no encontrada
      </h1>
      <p className={styles.description}>
        La dirección que buscás no existe o fue movida.
      </p>
      <motion.div
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <Link to="/explorar" className={styles.link}>
          Volver al catálogo
        </Link>
      </motion.div>
    </motion.section>
  )
}

export default NotFound
