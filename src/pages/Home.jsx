import './Home.css'

const carouselProducts = [
  { id: 1, name: 'Máquina de coser', price: '$4.500/día', image: '/images/maquinacoser.jpg' },
  { id: 2, name: 'Taladro eléctrico', price: '$2.000/día', image: '/images/taladro.jpg' },
  { id: 3, name: 'Horno microondas', price: '$1.500/día', image: '/images/microondas.jpg' },
  { id: 4, name: 'Bicicleta', price: '$3.000/día', image: '/images/bicicleta.jpg' },
  { id: 5, name: 'Herramientas varias', price: '$1.800/día', image: '/images/herramientas.jpg' },
  { id: 6, name: 'Consola de video', price: '$5.000/día', image: '/images/consola.jpg' },
]

const duplicated = [...carouselProducts, ...carouselProducts]

function Home() {
  return (
    <>
    <section className="hero-section">
      <div className="hero-content">
        <h1>Gente Comun</h1>
        <p className="tagline">Alquilando cosas comunes</p>
        <p className="description">
          La plataforma donde las personas comunes pueden alquilar y compartir
          cosas del día a día. Herramientas, equipos, y todo lo que necesites
          sin comprarlo.
        </p>
        <a href="#explorar" className="hero-cta">
          Explorar
        </a>
      </div>

      <div className="hero-carousel">
        <div className="carousel-track">
          {duplicated.map((product, index) => (
            <div className="carousel-card" key={`${product.id}-${index}`}>
              <img
                className="carousel-card-img"
                src={product.image}
                alt={product.name}
              />
              <div className="carousel-card-body">
                <p className="carousel-card-name">{product.name}</p>
                <p className="carousel-card-price">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="steps-section">
      <h2 className="steps-title">Publicá en 3 simples pasos</h2>
      <p className="steps-subtitle">Es tan fácil que lo hacés en un minuto</p>

      <div className="steps-container">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3>Subí tu producto</h3>
          <p>Foto, nombre y descripción. ¡Listo!</p>
        </div>

        <div className="step-connector">
          <div className="connector-line"></div>
          <div className="connector-dot"></div>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h3>Seteá el precio</h3>
          <p>Vos decidís cuánto cobrás por día</p>
        </div>

        <div className="step-connector">
          <div className="connector-line"></div>
          <div className="connector-dot"></div>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <div className="step-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>¡Listo! Alquilalo</h3>
          <p>Recibís pedidos y ganás dinero</p>
        </div>
      </div>
    </section>
    </>
  )
}
export default Home
