const productos = [
  {
    id: 1,
    nombre: "Taladro",
    precio: 15000,
    imagen: "https://"
  },
  {
    id: 2,
    nombre: "Escalera",
    precio: 8000,
    imagen: "https://"
  },
  {
    id: 3,
    nombre: "Carpa",
    precio: 12000,
    imagen: "https://"
  }
];

function PageCatalogo() {
  return (
    <>
      <h1>Catálogo</h1>

      <p>Encontrá lo que necesitás cerca tuyo.</p>
      
      {productos.map((producto) => (
        <div key={producto.id}>
          <h2>{producto.nombre}</h2>
          <p>${producto.precio} por día</p>
        </div>
      ))}
    </>
  )
}

export default PageCatalogo