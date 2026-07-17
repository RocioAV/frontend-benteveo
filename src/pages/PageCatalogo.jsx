import ProductCard from '../components/ProductCard/ProductCard.jsx'
import './PageCatalogo.css'
import products from '../data/products.json'

function PageCatalogo() {
  return (
    <section className="catalogo" aria-labelledby="catalogo-titulo">
      <header className="catalogo__encabezado">
        <h1 id="catalogo-titulo" className="catalogo__titulo">Catalogo</h1>
        <p className="catalogo__descripcion">Encontra lo que necesitas cerca tuyo.</p>
      </header>

      <div className="catalogo__grilla">
        {products.map((product) => (
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
