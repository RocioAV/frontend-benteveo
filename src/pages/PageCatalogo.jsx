import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import ProductCard from '../components/ProductCard/ProductCard.jsx'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import { isWithinRange, matchesQuery } from '../utils/products.js'
import './PageCatalogo.css'
import products from '../data/products.json'

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

function PageCatalogo() {
  const { query = '', onSearch = () => {} } = useOutletContext() || {}
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)

  const nearbyProducts = products.filter((product) => isWithinRange(product.distance))
  const categories = ['Todos', ...new Set(nearbyProducts.map((product) => product.category))]
  const filteredByCategory =
    selectedCategory === 'Todos'
      ? nearbyProducts
      : nearbyProducts.filter((product) => product.category === selectedCategory)
  const filteredProducts =
    query.trim() === ''
      ? filteredByCategory
      : filteredByCategory.filter((product) => matchesQuery(product, query))

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * PRODUCTS_PER_PAGE,
    safePage * PRODUCTS_PER_PAGE
  )

  const handleClearFilters = () => {
    onSearch('')
    setSelectedCategory('Todos')
  }

  const resultsLabel =
    query.trim() !== ''
      ? `${filteredProducts.length} ${
          filteredProducts.length === 1 ? 'resultado' : 'resultados'
        } para «${query.trim()}»`
      : selectedCategory === 'Todos'
        ? `${nearbyProducts.length} productos disponibles`
        : `${filteredProducts.length} en ${selectedCategory}`

  return (
    <MotionConfig reducedMotion="user">
      <section className="catalogo" aria-labelledby="catalogo-titulo">
        <header className="catalogo__encabezado">
          <h1 id="catalogo-titulo" className="catalogo__titulo">
            Explorá productos
          </h1>
          <p className="catalogo__descripcion">Encontrá lo que necesitás cerca tuyo.</p>
          <p className="catalogo__resultado" aria-live="polite">
            {resultsLabel}
          </p>
        </header>

        <nav className="category-filters" aria-label="Filtros por categoría">
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

        {filteredProducts.length === 0 ? (
          <EmptyState
            message="No se encontraron productos que coincidan con tu búsqueda."
            actionLabel="Limpiar filtros"
            onAction={handleClearFilters}
          />
        ) : (
          <>
            <div className="catalogo__grilla">
              {paginatedProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>

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
          </>
        )}
      </section>
    </MotionConfig>
  )
}

export default PageCatalogo
