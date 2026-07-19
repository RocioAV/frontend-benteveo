import './ProductCard.css'
// Funcion de una tajeta de producto que recibe un objeto de producto como propiedad y renderiza su imagen, titulo, ciudad y precio por día.
function ProductCard({ product }) {
  return (
    <article className="product-card"> {/* Tarjeta de producto */}
      <img 
        className="product-card__image"  /* Imagen del producto */
        src={product.imageUrl}
        alt={product.title}
      />
      
      <div className="product-card__content"> {/*Contenido de la tarjeta */}
        <h2 className="product-card__title">{/* Título del producto  */}
          {product.title} 
        </h2>

        <p className="product-card__city"> {/* Ciudad del producto */}
          {product.city}
        </p>  
        <p className="product-card__price"> {/* Precio por día */}
          ${product.pricePerDay.toLocaleString('es-AR')}{' '} {/* Precio formateado */}
          <span>por día</span>
        </p>

        <button className="product-card__button" type="button"> {/* Botón para ver detalle del producto */}
          Ver detalle
        </button>
      </div>
    </article>
  )
}

export default ProductCard
