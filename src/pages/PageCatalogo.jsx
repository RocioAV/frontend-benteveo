import './PageCatalogo.css'
import productos from '../data/products.json'

function PageCatalogo() {
  return (
    <section className="catalogo" aria-labelledby="catalogo-titulo">
      <header className="catalogo__encabezado">
        <h1 id="catalogo-titulo" className="catalogo__titulo">Catalogo</h1>
        <p className="catalogo__descripcion">Encontra lo que necesitas cerca tuyo.</p>
      </header>

      <div className="catalogo__grilla">
        {productos.map((producto) => (
          <article className="producto-card" key={producto.id}>
            <img
              className="producto-card__imagen"
              src={producto.imageUrl}
              alt={producto.title}
            />

            <div className="producto-card__contenido">
              <h2 className="producto-card__nombre">{producto.title}</h2>
              <p className="producto-card__ciudad">{producto.city}</p>
              <p className="producto-card__precio">
                ${producto.pricePerDay.toLocaleString('es-AR')} <span>por dia</span>
              </p>
              <button className="producto-card__boton" type="button">
                Ver detalle
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default PageCatalogo
