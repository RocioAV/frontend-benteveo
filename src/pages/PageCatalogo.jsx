import { useState } from 'react'
import ProductCard from '../components/ProductCard/ProductCard.jsx'
import './PageCatalogo.css'
import products from '../data/products.json'

function PageCatalogo() {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const categories = ['Todos', ...new Set(products.map((product) => product.category))]
  const filteredProducts = 
    selectedCategory === 'Todos'
    ? products
    : products.filter((product) => product.category === selectedCategory)
  return (
    <section className="catalogo" aria-labelledby="catalogo-titulo">
      <header className="catalogo__encabezado">
        <h1 id="catalogo-titulo" className="catalogo__titulo">Catalogo</h1>
        <p className="catalogo__descripcion">Encontra lo que necesitas cerca tuyo.</p>
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
