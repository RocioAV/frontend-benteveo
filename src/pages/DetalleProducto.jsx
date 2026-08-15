import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import products from '../data/products.json'
import Reservation from './Reservation.jsx'
import ProductCard from '../components/ProductCard/ProductCard.jsx'

// Springs (DESIGN.md §3 — gramática mecánico-líquida)
const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }
const springSoft = { type: 'spring', stiffness: 170, damping: 26 }

function DetalleProducto() {
  const { id } = useParams()
  const product = products.find(p => p.id === Number(id))

  const [activeTab, setActiveTab] = useState('descripcion')
  const [showAllReviews, setShowAllReviews] = useState(false)

  if (!product) {
    return (
      <MotionConfig reducedMotion="user">
        <motion.div
          className="flex flex-col items-center justify-center py-20"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springReveal}
        >
          <h1 className="text-2xl font-bold text-[var(--color-dark)] mb-4">Producto no encontrado</h1>
          <Link to="/explorar" className="text-[var(--color-brown)] hover:text-[var(--color-dark)] font-semibold">
            Volver al catálogo
          </Link>
        </motion.div>
      </MotionConfig>
    )
  }

  const reviews = product.reviews || []
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3)
  const suggestions = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  const renderStars = (count) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < count ? 'text-[var(--color-amber-400)]' : 'text-[var(--color-border)]'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Breadcrumb — ruta de llegada al producto */}
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold mb-5" aria-label="Ruta de navegación">
          <Link to="/" className="text-[var(--color-concrete)] hover:text-[var(--color-dark)] transition-colors">INICIO</Link>
          <span className="text-[var(--color-border)]">›</span>
          <Link to="/explorar" className="text-[var(--color-concrete)] hover:text-[var(--color-dark)] transition-colors">{product.category.toUpperCase()}</Link>
          <span className="text-[var(--color-border)]">›</span>
          <span className="text-[var(--color-dark)]">{product.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ===================== COLUMNA IZQUIERDA ===================== */}
          <div className="flex-1 min-w-0">

            {/* 1. GALERÍA PRINCIPAL */}
            <motion.div
              className="relative rounded-3xl overflow-hidden bg-[var(--color-concrete-surface)] mb-5"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springSoft}
            >
              <motion.img
                src={product.imageUrl}
                alt={product.title}
                decoding="async"
                className="w-full aspect-[4/3] object-contain bg-[var(--color-surface)]"
                whileHover={{ scale: 1.03 }}
                transition={springSoft}
              />

              {/* Botones favorito + compartir */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <motion.button
                  className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shadow-[var(--shadow-sm)]"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.96 }}
                  transition={springLatch}
                  aria-label="Favorito"
                >
                  <svg className="w-5 h-5 text-[var(--color-concrete)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </motion.button>
                <motion.button
                  className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shadow-[var(--shadow-sm)]"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.96 }}
                  transition={springLatch}
                  aria-label="Compartir"
                >
                  <svg className="w-5 h-5 text-[var(--color-concrete)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>

            {/* 2. TÍTULO (debajo de la foto) */}
            <motion.h1
              className="text-3xl md:text-4xl font-extrabold text-[var(--color-dark)] mb-3"
              style={{ fontFamily: 'var(--font-title)' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springReveal, delay: 0.08 }}
            >
              {product.title}
            </motion.h1>

            {/* 3. BADGES */}
            <motion.div
              className="flex flex-wrap items-center gap-3 mb-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springReveal, delay: 0.12 }}
            >
              <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-[var(--color-primary)] text-[var(--color-dark)]">
                {product.category}
              </span>
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[var(--color-concrete-surface)] text-[var(--color-concrete)] border border-[var(--color-border)]">
                {product.isAvailable ? 'Disponible' : 'No disponible'}
              </span>
            </motion.div>

            {/* 4. FILA DE METADATOS */}
            <motion.div
              className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-concrete)] mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springReveal, delay: 0.16 }}
            >
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[var(--color-amber-400)]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold text-[var(--color-dark)]">{product.rating}</span>
                <span>({reviews.length} reseñas)</span>
              </div>

              <span className="text-[var(--color-border)]">·</span>

              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[var(--color-concrete)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{product.city}, {product.region} · {product.distance}</span>
              </div>

              <span className="text-[var(--color-border)]">·</span>

              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[var(--color-concrete)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <span>{product.completedRentals} alquileres completados</span>
              </div>
            </motion.div>

            {/* 5. TARJETA DEL DUEÑO */}
            <motion.div
              className="flex items-center justify-between bg-[var(--color-surface)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-4 mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springReveal, delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-brown)] flex items-center justify-center text-[var(--color-surface)] font-bold text-sm">
                  {product.owner.initials}
                </div>
                <div>
                  <p className="font-bold text-[var(--color-dark)] text-sm">{product.owner.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-concrete)]">
                    <svg className="w-3.5 h-3.5 text-[var(--color-brown)]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    <span>Identidad verificada</span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span>Miembro desde {product.owner.memberSince}</span>
                  </div>
                </div>
              </div>
              <motion.button
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[var(--color-border)] text-sm font-semibold text-[var(--color-dark)] hover:border-[var(--color-primary)] hover:bg-[var(--color-concrete-surface)] transition-colors"
                whileTap={{ scale: 0.96 }}
                transition={springLatch}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 20.105V4.875A1.875 1.875 0 015.625 3h12.75A1.875 1.875 0 0120.25 4.875v10.5A1.875 1.875 0 0118.375 17.25H7.5l-3.75 2.855z" />
                </svg>
                Contactar
              </motion.button>
            </motion.div>

            {/* 6. TABS */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springReveal, delay: 0.24 }}
            >
              <div className="flex gap-8 border-b border-[var(--color-border)]">
                <button
                  onClick={() => setActiveTab('descripcion')}
                  className={`pb-3 text-sm font-semibold transition-colors ${
                    activeTab === 'descripcion'
                      ? 'text-[var(--color-dark)] border-b-2 border-[var(--color-primary)]'
                      : 'text-[var(--color-concrete)] hover:text-[var(--color-dark)]'
                  }`}
                >
                  Descripción
                </button>
                <button
                  onClick={() => setActiveTab('politicas')}
                  className={`pb-3 text-sm font-semibold transition-colors ${
                    activeTab === 'politicas'
                      ? 'text-[var(--color-dark)] border-b-2 border-[var(--color-primary)]'
                      : 'text-[var(--color-concrete)] hover:text-[var(--color-dark)]'
                  }`}
                >
                  Políticas
                </button>
              </div>

              <motion.div
                key={activeTab}
                className="pt-5 text-sm text-[var(--color-concrete)] leading-relaxed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springReveal}
              >
                {activeTab === 'descripcion' ? (
                  <p>{product.description}</p>
                ) : (
                  <p>{product.policies}</p>
                )}
              </motion.div>
            </motion.div>

            {/* 7. SECCIÓN DE RESEÑAS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springReveal, delay: 0.28 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-[var(--color-dark)]" style={{ fontFamily: 'var(--font-title)' }}>
                  Reseñas ({reviews.length})
                </h2>
                <div className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-[var(--color-amber-400)]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-bold text-[var(--color-dark)]">{product.rating}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {visibleReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)]"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ ...springReveal, delay: (index % 3) * 0.03 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-concrete-surface)] flex items-center justify-center text-[var(--color-concrete)] font-semibold text-xs">
                          {review.initials}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-dark)] text-sm">{review.author}</p>
                          <p className="text-xs text-[var(--color-concrete)]">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-sm text-[var(--color-concrete)] leading-relaxed">{review.comment}</p>
                  </motion.div>
                ))}
              </div>

              {reviews.length > 3 && (
                <motion.button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="flex items-center gap-2 mt-4 text-sm font-semibold text-[var(--color-dark)] underline underline-offset-4 hover:text-[var(--color-brown)] transition-colors"
                  whileTap={{ scale: 0.96 }}
                  transition={springLatch}
                >
                  {showAllReviews ? 'Ocultar reseñas' : `Ver las ${reviews.length - 3} reseñas`}
                  <svg
                    className={`w-4 h-4 transition-transform ${showAllReviews ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </motion.button>
              )}
            </motion.div>

          </div>
          {/* ===================== FIN COLUMNA IZQUIERDA ===================== */}

          {/* ===================== COLUMNA DERECHA (RESERVA) ===================== */}
          <motion.div
            className="w-full lg:w-[380px] flex-shrink-0"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springReveal, delay: 0.15 }}
          >
            <Reservation product={product} />
          </motion.div>

        </div>

        {/* ===================== CONDICIONES DE ALQUILER ===================== */}
        <section className="mt-12 border-t border-[var(--color-border)] pt-8">
          <h2 className="text-xl font-bold text-[var(--color-dark)] mb-4" style={{ fontFamily: 'var(--font-title)' }}>
            Condiciones de alquiler
          </h2>
          <div className="bg-[var(--color-concrete-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
            <h3 className="font-bold text-[var(--color-dark)] mb-2">Depósito de Garantía</h3>
            <p className="text-sm text-[var(--color-concrete)] leading-relaxed m-0">
              Se retendrá temporalmente ${product.deposit.toLocaleString('es-AR')} en tu tarjeta que se liberarán al devolver el producto en buen estado.
            </p>
          </div>
        </section>

        {/* Sugerencias de la misma categoría */}
        {suggestions.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-[var(--color-dark)] mb-5" style={{ fontFamily: 'var(--font-title)' }}>
              Productos similares
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestions.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}

      </div>
    </MotionConfig>
  )
}

export default DetalleProducto
