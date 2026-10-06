import styles from './Skeleton.module.css'

const VARIANT_CLASSES = {
  rows: styles.rows,
  cards: styles.cards,
  carousel: styles.carousel,
  form: styles.form,
  chat: styles.chat,
}

function SkeletonItem({ variant, index }) {
  if (variant === 'cards' || variant === 'carousel') {
    return (
      <div key={index} className={styles.skeletonRow} aria-hidden="true">
        <div className={styles.skeletonMedia} />
        <div className={styles.skeletonCardBody}>
          <div className={`${styles.skeletonLine} ${styles.skeletonLineLong}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineMeta}`} />
        </div>
      </div>
    )
  }

  return <div key={index} className={styles.skeletonRow} aria-hidden="true" />
}

function Skeleton({ rows = 3, variant = 'rows', label = 'Cargando contenido' }) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.rows

  return (
    <div className={`${styles.skeleton} ${variantClass}`} role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonItem key={index} variant={variant} index={index} />
      ))}
    </div>
  )
}

export default Skeleton
