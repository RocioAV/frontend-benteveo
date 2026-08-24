import { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard/ProductCard.jsx'
import { getProducts } from '../services/product.service.js'
import './PageCatalogo.css'

function PageCatalogo() {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const categories = ['Todos', ...new Set(products.map((product) => product.category))]
  const filteredProducts =
    selectedCategory === 'Todos'
      ? products
      : products.filter((product) => product.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error al cargar productos</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    )
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
      <div className="catalogo__grilla">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  )
}

export default PageCatalogo
