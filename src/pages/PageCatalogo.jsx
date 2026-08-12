import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import ProductCard from '../components/ProductCard/ProductCard.jsx'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import './PageCatalogo.css'
import products from '../data/products.json'

function PageCatalogo() {
  const { query = '', onSearch = () => {} } = useOutletContext() || {}
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const categories = ['Todos', ...new Set(products.map((product) => product.category))]
  const normalizedQuery = query.trim().toLowerCase()
  const filteredByCategory =
    selectedCategory === 'Todos'
    ? products
    : products.filter((product) => product.category === selectedCategory)
  const filteredProducts =
    normalizedQuery === ''
      ? filteredByCategory
      : filteredByCategory.filter(
          (product) =>
            product.title.toLowerCase().includes(normalizedQuery) ||
            product.category.toLowerCase().includes(normalizedQuery) ||
            product.city.toLowerCase().includes(normalizedQuery)
        )
  const handleClearFilters = () => {
    onSearch('')
    setSelectedCategory('Todos')
  }
  return (
    <section className="catalogo" aria-labelledby="catalogo-titulo">
      <header className="catalogo__encabezado">
        <h1 id="catalogo-titulo" className="catalogo__titulo">Explorá productos</h1>
        <p className="catalogo__descripcion">Encontrá lo que necesitás cerca tuyo.</p>
      </header>
      <div className="category-filters" aria-label="Filtros por categoria">
        {categories.map((category) => (
          <button
            key={category}
            className={
              selectedCategory === category
                ? 'category-filter category-filter--active'
                : 'category-filter'
            }
            type="button"
            aria-pressed={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      {filteredProducts.length === 0 ? (
        <EmptyState
          message="No se encontraron productos que coincidan con tu búsqueda."
          actionLabel="Limpiar filtros"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="catalogo__grilla">
          {filteredProducts.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default PageCatalogo