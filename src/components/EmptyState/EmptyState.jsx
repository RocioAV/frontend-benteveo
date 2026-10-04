import { motion } from 'motion/react'
import soloLogo from '../../assets/solo-logo-app.webp'
import styles from './EmptyState.module.css'

function EmptyState({ message, actionLabel, onAction }) {
  return (
    <motion.div
      className={styles.emptyState}
      role="status"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <img src={soloLogo} className={styles.bird} alt="" />
      <p className={styles.message}>{message}</p>
      {actionLabel && onAction && (
        <motion.button
          type="button"
          className={styles.action}
          onClick={onAction}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}

export default EmptyState
