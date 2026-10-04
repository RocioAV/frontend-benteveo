// src/components/Skeleton/Skeleton.jsx
import styles from './Skeleton.module.css'

// Placeholder de carga — CSS Modules, SOLO vars del root (guard de diseño).
// Sin integrar aún: PageCatalogo carga datos síncronos (products.json),
// no tiene estado de loading. Se integra cuando exista carga async.
function Skeleton({ rows = 3 }) {
  return (
    <div className={styles.skeleton} role="status" aria-label="Cargando contenido">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.skeletonRow} aria-hidden="true" />
      ))}
    </div>
  )
}

export default Skeleton