import { useEffect, useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import ProductCard from '../components/ProductCard/ProductCard.jsx'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import Skeleton from '../components/Skeleton/Skeleton.jsx'
import LocationModal from '../components/modals/LocationModal.jsx'
import { useLocation } from '../context/LocationContext.jsx'
import { PROXIMITY_RADIUS_KM, getProductProximity, matchesQuery } from '../utils/products.js'
import { fetchProducts } from '../services/products.service.js'
import './PageCatalogo.css'

const PRODUCTS_PER_PAGE = 12

const CATEGORY_ICONS = {
  Electrodomésticos: 'plug',
  Herramientas: 'toolbox',
  'Aire libre': 'campground',
  Electrónica: 'headphones',
  Muebles: 'couch',
  'Cumpleaños y celebraciones': 'cake-candles',
  Jardinería: 'seedling',
}

function formatCoordinates(position) {
  const latitude = position?.coords?.latitude
  const longitude = position?.coords?.longitude

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

function PageCatalogo() {
  const { query = '', onSearch = () => {} } = useOutletContext() || {}
  const { status: locationStatus, position } = useLocation()
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const trackRef = useRef(null)

  const [products, setProducts] = useState(null) // null = cargando
  const [error, setError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchProducts()
      .then((data) => {
        if (cancelled) return
        setProducts(data)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const handleRetry = () => {
    setProducts(null)
    setError(false)
    setReloadToken((token) => token + 1)
  }

  const locationReady = locationStatus === 'active' || locationStatus === 'demo'
  const locationError = locationStatus === 'denied'
    || locationStatus === 'unavailable'
    || locationStatus === 'timeout'
  const locationStatusText = locationReady
    ? locationStatus === 'demo' ? 'Zona de referencia activa' : 'Ubicación activa'
    : locationError ? 'No pudimos verificar tu ubicación'
      : locationStatus === 'requesting' ? 'Verificando ubicación…'
        : 'Ubicación sin activar'
  const locationActionText = locationReady
    ? 'Ver estado'
    : locationError ? 'Reintentar ubicación' : 'Activar ubicación'
  const locationCoordinates = locationStatus === 'active' ? formatCoordinates(position) : null

  if (error) {
    return (
      <MotionConfig reducedMotion="user">
        <section className="catalogo" aria-label="Error al cargar productos">
          <EmptyState
            message="No pudimos cargar los productos. Probá de nuevo en unos segundos."
            actionLabel="Reintentar"
            onAction={handleRetry}
          />
        </section>
      </MotionConfig>
    )
  }

  if (products === null) {
    return (
      <section className="catalogo" aria-label="Cargando catálogo">
        <Skeleton rows={6} />
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <MotionConfig reducedMotion="user">
        <section className="catalogo" aria-labelledby="catalogo-titulo">
          <header className="catalogo__encabezado">
            <h1 id="catalogo-titulo" className="catalogo__titulo">
              Explorá productos
            </h1>
          </header>
          <EmptyState message="Todavía no hay productos publicados. Volvé más tarde." />
          <LocationModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
        </section>
      </MotionConfig>
    )
  }

  const categories = ['Todos', ...new Set(products.map((product) => product.category).filter(Boolean))]
  const filteredByCategory =
    selectedCategory === 'Todos'
      ? products
      : products.filter((product) => product.category === selectedCategory)
  const filteredProducts =
    query.trim() === ''
      ? filteredByCategory
      : filteredByCategory.filter((product) => matchesQuery(product, query))
  const nearbyCount = filteredProducts.filter((product) => getProductProximity(product).withinRadius).length

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * PRODUCTS_PER_PAGE,
    safePage * PRODUCTS_PER_PAGE
  )
  const paginatedNearbyProducts = paginatedProducts.filter(
    (product) => getProductProximity(product).withinRadius,
  )
  const paginatedDistantProducts = paginatedProducts.filter(
    (product) => !getProductProximity(product).withinRadius,
  )

  const handleClearFilters = () => {
    onSearch('')
    setSelectedCategory('Todos')
  }

  const scrollCategories = (dir) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: dir * 260, behavior: 'smooth' })
  }

  const resultsLabel =
    query.trim() !== ''
      ? `${filteredProducts.length} ${
          filteredProducts.length === 1 ? 'resultado' : 'resultados'
        } para «${query.trim()}»`
      : selectedCategory === 'Todos'
        ? `${filteredProducts.length} productos disponibles · ${nearbyCount} cerca`
        : `${filteredProducts.length} en ${selectedCategory}`

  return (
    <MotionConfig reducedMotion="user">
      <section className="catalogo" aria-labelledby="catalogo-titulo">
        <header className="catalogo__encabezado">
          <h1 id="catalogo-titulo" className="catalogo__titulo">
            Explorá productos
          </h1>
          <p className="catalogo__descripcion">Encontrá lo que necesitás cerca tuyo.</p>
        </header>

        {locationCoordinates ? (
          <p className="location-confirmation" role="status" aria-live="polite">
            Tu ubicación es {locationCoordinates}
          </p>
        ) : (
          <section className={`location-banner${locationReady ? ' location-banner--active' : ''}`} aria-labelledby="location-banner-title">
            <div className="location-banner__icon" aria-hidden="true">
              <i className={`fas ${locationReady ? 'fa-location-dot' : 'fa-location-crosshairs'}`} />
            </div>
            <div className="location-banner__copy">
              <p className="location-banner__eyebrow">Cercanía · radio de 10 cuadras ({PROXIMITY_RADIUS_KM} km)</p>
              <h2 id="location-banner-title">{locationStatusText}</h2>
              <p>
                {locationReady
                  ? locationStatus === 'demo'
                    ? 'Estamos usando una zona de referencia para ordenar resultados por cercanía.'
                    : 'Usamos tu ubicación sólo durante esta sesión para verificar la cercanía.'
                  : `Activá la ubicación para verificar qué herramientas están dentro de ${PROXIMITY_RADIUS_KM} km.`}
              </p>
            </div>
            <button
              type="button"
              className="location-banner__action"
              onClick={() => setLocationModalOpen(true)}
            >
              {locationActionText}
            </button>
          </section>
        )}

        {/* Slider de categorías */}
        <div className="category-slider">
          <button
            type="button"
            className="category-arrow"
            onClick={() => scrollCategories(-1)}
            aria-label="Categorías anteriores"
          >
            <i className="fas fa-chevron-left" aria-hidden="true" />
          </button>
          <nav className="category-filters" ref={trackRef} aria-label="Filtros por categoría">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? 'category-filter category-filter--active'
                    : 'category-filter'
                }
                aria-pressed={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              >
                <span className="category-filter__icon">
                  <i
                    className={`fas ${
                      category === 'Todos' ? 'fa-th' : `fa-${CATEGORY_ICONS[category] || 'tag'}`
                    }`}
                    aria-hidden="true"
                  />
                </span>
                <span className="category-filter__label">{category}</span>
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="category-arrow"
            onClick={() => scrollCategories(1)}
            aria-label="Categorías siguientes"
          >
            <i className="fas fa-chevron-right" aria-hidden="true" />
          </button>
        </div>

        {/* Contador debajo de las categorías */}
        <p className="catalogo__resultado" aria-live="polite">
          {resultsLabel}
        </p>

        {filteredProducts.length === 0 ? (
          <EmptyState
            message="No se encontraron productos que coincidan con tu búsqueda."
            actionLabel="Limpiar filtros"
            onAction={handleClearFilters}
          />
        ) : (
          <>
            {paginatedNearbyProducts.length > 0 && (
              <section aria-labelledby="productos-cercanos-titulo">
                <div className="catalogo__section-heading">
                  <div>
                   <p className="catalogo__section-eyebrow">Dentro de {PROXIMITY_RADIUS_KM} km · 10 cuadras</p>
                   <h2 id="productos-cercanos-titulo" className="catalogo__section-title">Cerca tuyo</h2>
                  </div>
                </div>
                <div className="catalogo__grilla">
                  {paginatedNearbyProducts.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>
              </section>
            )}

            {paginatedDistantProducts.length > 0 && (
              <section className="catalogo__distant-section" aria-labelledby="productos-lejanos-titulo">
                <div className="catalogo__section-heading">
                  <div>
                   <p className="catalogo__section-eyebrow">Más allá del radio</p>
                   <h2 id="productos-lejanos-titulo" className="catalogo__section-title">Fuera de tu radio</h2>
                  </div>
                  <span className="catalogo__section-note">Podés consultar la distancia, pero no abrir el detalle</span>
                </div>
                <div className="catalogo__grilla">
                  {paginatedDistantProducts.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} locked />
                  ))}
                </div>
              </section>
            )}

            {totalPages > 1 && (
              <nav className="pagination" aria-label="Paginación de productos">
                <button
                  className="pagination__btn"
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                  aria-label="Página anterior"
                >
                  <i className="fas fa-chevron-left" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={
                      page === safePage
                        ? 'pagination__btn pagination__btn--active'
                        : 'pagination__btn'
                    }
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === safePage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="pagination__btn"
                  onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Página siguiente"
                >
                  <i className="fas fa-chevron-right" aria-hidden="true" />
                </button>
              </nav>
            )}

            {/* Info útil: pagos, entregas, seguridad */}
            <section className="catalogo-info" aria-label="Información útil">
              <div className="catalogo-info__item">
                <span className="catalogo-info__icon">
                  <i className="fas fa-credit-card" aria-hidden="true" />
                </span>
                <span className="catalogo-info__line" aria-hidden="true" />
                <h3>¿Cómo pago?</h3>
                <p>
                  Abonás con MercadoPago: tarjeta de crédito, débito o efectivo. El pago se
                  libera recién cuando recibís el producto.
                </p>
              </div>
              <div className="catalogo-info__item">
                <span className="catalogo-info__icon">
                  <i className="fas fa-truck" aria-hidden="true" />
                </span>
                <span className="catalogo-info__line" aria-hidden="true" />
                <h3>Tipos de entrega</h3>
                <p>
                  Retiro en el domicilio del propietario (sin costo) o entrega a domicilio con
                  costo según la distancia.
                </p>
              </div>
              <div className="catalogo-info__item">
                <span className="catalogo-info__icon">
                  <i className="fas fa-shield-alt" aria-hidden="true" />
                </span>
                <span className="catalogo-info__line" aria-hidden="true" />
                <h3>Seguridad y garantía</h3>
                <p>
                  Depósito de garantía reembolsable y soporte de Benteveo si algo sale mal.
                  Protegemos tu alquiler de punta a punta.
                </p>
              </div>
            </section>
          </>
        )}
        <LocationModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
      </section>
    </MotionConfig>
  )
}

export default PageCatalogo
