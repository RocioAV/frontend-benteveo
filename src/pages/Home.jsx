import { useState, useEffect, useRef } from 'react'
import './Home.css'

const carouselProducts = [
  { id: 1, name: 'Máquina de coser', price: '$4.500/día', image: '/images/maquinacoser.jpg' },
  { id: 2, name: 'Taladro eléctrico', price: '$2.000/día', image: '/images/taladro.jpg' },
  { id: 3, name: 'Horno microondas', price: '$1.500/día', image: '/images/microondas.jpg' },
  { id: 4, name: 'Bicicleta', price: '$3.000/día', image: '/images/bicicleta.jpg' },
  { id: 5, name: 'Herramientas varias', price: '$1.800/día', image: '/images/herramientas.jpg' },
  { id: 6, name: 'Consola de video', price: '$5.000/día', image: '/images/consola.jpg' },
]

const duplicated = [...carouselProducts, ...carouselProducts, ...carouselProducts]

function Home() {
  const [activeStep, setActiveStep] = useState(0)
  const trackRef = useRef(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const calcOffset = () => {
      if (!trackRef.current) return
      const cards = trackRef.current.children
      const totalCards = carouselProducts.length
      let width = 0
      for (let i = 0; i < totalCards; i++) {
        const card = cards[i]
        width += card.offsetWidth
        if (i < totalCards - 1) {
          width += parseFloat(getComputedStyle(trackRef.current).gap) || 24
        }
      }
      setOffset(width)
    }

    calcOffset()
    window.addEventListener('resize', calcOffset)
    return () => window.removeEventListener('resize', calcOffset)
  }, [])

  return (
    <div className="w-full">
      <section className="welcome-fade relative w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-[10%] w-16 h-16 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-1 right-[15%] w-10 h-10 border-2 border-white rounded-full"></div>
          <div className="absolute top-3 right-[30%] w-6 h-6 bg-white rounded-full"></div>
        </div>
        <div className="flex justify-center items-center py-8 px-6 md:py-10">
          <div className="text-center">
            <p className="text-white/80 text-sm md:text-base font-medium tracking-[0.3em] uppercase mb-2">Tu plataforma de alquiler</p>
            <h1 className="text-white font-bold text-3xl md:text-5xl lg:text-6xl drop-shadow-md">
              Bienvenido a <span className="text-[#423224]">Benteveo</span>
            </h1>
          </div>
        </div>
      </section>
      {/* HERO */}
      <section className="hero-section flex flex-col md:flex-row items-center gap-8 py-16 px-6 md:px-10 bg-[#FAF8F5]">
        <div className="description flex-1 max-w-xl">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-500 mb-2">
            Gente Comun
          </h2>
          <p className="text-xl md:text-2xl text-[#423224] mb-6">
            Alquilando cosas comunes
          </p>
          <p className="text-base md:text-lg text-[#57534e] leading-relaxed mb-8">
            La plataforma donde las personas comunes pueden alquilar y compartir
            cosas del día a día. Herramientas, equipos, y todo lo que necesites
            sin comprarlo.
          </p>
          <a
            href="#explorar"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            Explorar
          </a>
        </div>

        <div className="flex-1 flex justify-center items-center overflow-hidden py-4">
          <div
            ref={trackRef}
            className="carousel-track"
            style={{ '--scroll-offset': `-${offset}px` }}
          >
            {duplicated.map((product, index) => (
              <div className="carousel-card" key={`${product.id}-${index}`}>
                <img
                  className="carousel-card-img"
                  src={product.image}
                  alt={product.name}
                />
                <div className="p-3 text-center">
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate m-0">{product.name}</p>
                  <p className="text-xs font-bold text-amber-500 mt-1 m-0">{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="relative overflow-hidden py-16 px-6 bg-[#FAF8F5] text-center">
        {/* Decor izquierda */}
        <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-0">
          <svg viewBox="0 0 120 400" className="w-full h-full">
            <circle cx="10" cy="50" r="30" fill="currentColor" className="text-amber-500 opacity-70" />
            <circle cx="40" cy="150" r="45" fill="currentColor" className="text-amber-500 opacity-60" />
            <circle cx="15" cy="280" r="35" fill="currentColor" className="text-amber-500 opacity-50" />
            <circle cx="50" cy="370" r="25" fill="currentColor" className="text-amber-500 opacity-40" />
          </svg>
        </div>

        {/* Decor derecha */}
        <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-0">
          <svg viewBox="0 0 120 400" className="w-full h-full">
            <circle cx="110" cy="50" r="30" fill="currentColor" className="text-amber-500 opacity-70" />
            <circle cx="80" cy="150" r="45" fill="currentColor" className="text-amber-500 opacity-60" />
            <circle cx="105" cy="280" r="35" fill="currentColor" className="text-amber-500 opacity-50" />
            <circle cx="70" cy="370" r="25" fill="currentColor" className="text-amber-500 opacity-40" />
          </svg>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-2 relative z-10">
          Publicá en 3 simples pasos
        </h2>
        <p className="text-base md:text-lg text-[#78716c] mb-10 relative z-10">
          Es tan fácil que lo hacés en un minuto
        </p>

        <div className="flex justify-center items-start max-w-[900px] mx-auto relative z-10">
          {/* Paso 1 */}
          <div className={`step flex-1 max-w-[240px] px-4 ${activeStep === 0 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-9 h-9 text-amber-500">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Subí tu producto</h3>
            <p className="text-sm text-[#78716c] leading-relaxed m-0">Foto, nombre y descripción. ¡Listo!</p>
          </div>

          {/* Conector 1 */}
          <div className="step-connector flex items-center pt-[60px] w-[60px] relative">
            <div className="connector-line w-full h-0.5 bg-[#e7e5e4] relative overflow-hidden"></div>
            <div className="connector-dot w-2.5 h-2.5 bg-amber-500 rounded-full absolute -right-1.5"></div>
          </div>

          {/* Paso 2 */}
          <div className={`step flex-1 max-w-[240px] px-4 ${activeStep === 1 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-9 h-9 text-amber-500">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Seteá el precio</h3>
            <p className="text-sm text-[#78716c] leading-relaxed m-0">Vos decidís cuánto cobrás por día</p>
          </div>

          {/* Conector 2 */}
          <div className="step-connector flex items-center pt-[60px] w-[60px] relative">
            <div className="connector-line w-full h-0.5 bg-[#e7e5e4] relative overflow-hidden"></div>
            <div className="connector-dot w-2.5 h-2.5 bg-amber-500 rounded-full absolute -right-1.5"></div>
          </div>

          {/* Paso 3 */}
          <div className={`step flex-1 max-w-[240px] px-4 ${activeStep === 2 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-9 h-9 text-amber-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">¡Listo! Alquilalo</h3>
            <p className="text-sm text-[#78716c] leading-relaxed m-0">Recibís pedidos y ganás dinero</p>
          </div>
        </div>
      </section>
    </div>
  )
}
export default Home
