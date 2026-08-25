import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import products from '../data/products.json'
import { isWithinRange } from '../utils/products.js'
import ProductCard from '../components/ProductCard/ProductCard.jsx'
import './Home.css'

const nearbyProducts = products.filter((product) => isWithinRange(product.distance))
const duplicated = [...nearbyProducts, ...nearbyProducts, ...nearbyProducts]
const topRated = [...products]
  .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
  .slice(0, 4)

// Springs (DESIGN.md §3 — gramática mecánico-líquida)
const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

const METHOD_STEPS = [
  {
    icon: 'fa-location-dot',
    title: 'Encontrá cerca',
    text: 'Todo lo que ves está a menos de 10 km. Retiralo en el día o pedilo a domicilio.',
  },
  {
    icon: 'fa-shield-halved',
    title: 'Pagá protegido',
    text: 'Tu pago queda en resguardo y se libera recién cuando recibís el producto. MercadoPago respalda la operación.',
  },
  {
    icon: 'fa-handshake',
    title: 'Devolvé tranquilo',
    text: 'Un depósito de garantía reembolsable cuida al dueño, y el soporte de Benteveo resuelve cualquier imprevisto.',
  },
]

function Home() {
  const [activeStep, setActiveStep] = useState(0)
  const trackRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return // paso estático bajo reduce
    const timer = setInterval(() => {
      if (!pausedRef.current) {
        setActiveStep(prev => (prev + 1) % 3)
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const calcOffset = () => {
      if (!trackRef.current) return
      const cards = trackRef.current.children
      const totalCards = nearbyProducts.length
      let width = 0
      for (let i = 0; i < 5; i++) {
        const card = cards[i]
        width += card.offsetWidth
        if (i < totalCards - 1) {
          width += parseFloat(getComputedStyle(trackRef.current).gap) || 24
        }
      }
      setOffset(width)
    }

    calcOffset()
    window.addEventListener('resize', calcOffset)
    return () => window.removeEventListener('resize', calcOffset)
  }, [])

  return (
    <div className="w-full">
      {/* HERO */}
      <MotionConfig reducedMotion="user">
        <section className="hero-section">
          <div className="hero-copy">
            <motion.p
              className="hero-eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springReveal}
            >
              Te hacemos la gauchada
            </motion.p>
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springReveal, delay: 0.08 }}
            >
              Alquilá lo que usás una vez
            </motion.h1>
            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springReveal, delay: 0.14 }}
            >
              Herramientas, electrodomésticos y equipamiento de tu barrio, entre vecinos.
              Sin comprar, sin que te estorbe en casa.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springReveal, delay: 0.2 }}
            >
              <motion.div
                className="hero-cta-wrap"
                whileTap={{ scale: 0.96 }}
                transition={springLatch}
              >
                <Link to="/explorar" className="hero-cta">Explorar el catálogo</Link>
              </motion.div>
            </motion.div>
          </div>

          <div className="tool-wall">
            <div
              ref={trackRef}
              className="carousel-track"
              style={{ '--scroll-offset': `-${offset}px` }}
            >
              {duplicated.map((product, index) => (
                <div className="carousel-card" key={`${product.id}-${index}`}>
                  <img
                    className="carousel-card-img"
                    src={product.imageUrl}
                    alt={product.title}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="carousel-card-body">
                    <p className="carousel-card-title">{product.title}</p>
                    <div className="carousel-card-meta">
                      <span className="carousel-card-price">
                        ${product.pricePerDay.toLocaleString('es-AR')}
                        <span>/día</span>
                      </span>
                      {product.rating != null && (
                        <span className="carousel-card-rating">
                          <i className="fa-solid fa-star" aria-hidden="true" /> {Number(product.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </MotionConfig>

      {/* STEPS — Publicá en 3 simples pasos */}
      <section
        className="relative overflow-hidden py-16 px-6 bg-[var(--color-bg)] text-center"
        onMouseEnter={() => { pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false }}
      >
        {/* Decor izquierda */}
        <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-0">
          <svg viewBox="0 0 120 400" className="w-full h-full" aria-hidden="true">
            <circle cx="10" cy="50" r="30" fill="currentColor" className="text-[var(--color-primary)] opacity-70" />
            <circle cx="40" cy="150" r="45" fill="currentColor" className="text-[var(--color-primary)] opacity-60" />
            <circle cx="15" cy="280" r="35" fill="currentColor" className="text-[var(--color-primary)] opacity-50" />
            <circle cx="50" cy="370" r="25" fill="currentColor" className="text-[var(--color-primary)] opacity-40" />
          </svg>
        </div>

        {/* Decor derecha */}
        <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-0">
          <svg viewBox="0 0 120 400" className="w-full h-full" aria-hidden="true">
            <circle cx="110" cy="50" r="30" fill="currentColor" className="text-[var(--color-primary)] opacity-70" />
            <circle cx="80" cy="150" r="45" fill="currentColor" className="text-[var(--color-primary)] opacity-60" />
            <circle cx="105" cy="280" r="35" fill="currentColor" className="text-[var(--color-primary)] opacity-50" />
            <circle cx="70" cy="370" r="25" fill="currentColor" className="text-[var(--color-primary)] opacity-40" />
          </svg>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-dark)] mb-2 relative z-10">
          Publicá en 3 simples pasos
        </h2>
        <p className="text-base md:text-lg text-[var(--color-concrete)] mb-10 relative z-10">
          Es tan fácil que lo hacés en un minuto
        </p>

        <div className="flex justify-center items-start max-w-[900px] mx-auto relative z-10">
          {/* Paso 1 */}
          <div className={`step flex-1 max-w-[240px] px-4 ${activeStep === 0 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-9 h-9 text-[var(--color-primary)]" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-dark)] mb-2">Subí tu producto</h3>
            <p className="text-sm text-[var(--color-concrete)] leading-relaxed m-0">Foto, nombre y descripción. ¡Listo!</p>
          </div>

          {/* Conector 1 */}
          <div className="step-connector flex items-center pt-[60px] w-[60px] relative">
            <div className="connector-line w-full h-0.5 bg-[var(--color-border)] relative overflow-hidden"></div>
            <div className="connector-dot w-2.5 h-2.5 bg-[var(--color-primary)] rounded-full absolute -right-1.5"></div>
          </div>

          {/* Paso 2 */}
          <div className={`step flex-1 max-w-[240px] px-4 ${activeStep === 1 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-9 h-9 text-[var(--color-primary)]" aria-hidden="true">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-dark)] mb-2">Seteá el precio</h3>
            <p className="text-sm text-[var(--color-concrete)] leading-relaxed m-0">Vos decidís cuánto cobrás por día</p>
          </div>

          {/* Conector 2 */}
          <div className="step-connector flex items-center pt-[60px] w-[60px] relative">
            <div className="connector-line w-full h-0.5 bg-[var(--color-border)] relative overflow-hidden"></div>
            <div className="connector-dot w-2.5 h-2.5 bg-[var(--color-primary)] rounded-full absolute -right-1.5"></div>
          </div>

          {/* Paso 3 */}
          <div className={`step flex-1 max-w-[240px] px-4 ${activeStep === 2 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-9 h-9 text-[var(--color-primary)]" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-dark)] mb-2">¡Listo! Alquilalo</h3>
            <p className="text-sm text-[var(--color-concrete)] leading-relaxed m-0">Recibís pedidos y ganás dinero</p>
          </div>
        </div>
      </section>

      {/* FAVORITOS DE LOS CLIENTES */}
      <section className="featured-section favorites-section">
        <div className="featured-container">
          <h2 className="section-title">Los favoritos de los clientes</h2>
          <p className="section-sub">Lo más alquilado y mejor calificado de tu barrio.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topRated.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="featured-section">
        <div className="featured-container">
          <h2 className="section-title">Productos destacados</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearbyProducts.slice(0, 8).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/explorar" className="featured-more">Ver todos los productos</Link>
          </div>
        </div>
      </section>

      {/* METODOLOGÍA DE TRABAJO */}
      <MotionConfig reducedMotion="user">
        <section className="method-section">
          <div className="method-container">
            <motion.h2
              className="section-title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={springReveal}
            >
              Alquilar entre vecinos, sin vueltas
            </motion.h2>
            <motion.p
              className="section-sub"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ ...springReveal, delay: 0.05 }}
            >
              Nada de letra chica ni sorpresas. Así protegemos cada alquiler, de punta a punta.
            </motion.p>

            <div className="method-grid">
              {METHOD_STEPS.map((step, i) => (
                <motion.div
                  key={step.title}
                  className="method-card"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ ...springReveal, delay: i * 0.08 }}
                >
                  <span className="method-icon">
                    <i className={`fas ${step.icon}`} aria-hidden="true" />
                  </span>
                  <span className="method-line" aria-hidden="true" />
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </MotionConfig>
    </div>
  )
}

export default Home
