import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home">
      <h1>Bienvenido a Benteveo</h1>
      <p>Tu plataforma de streaming de películas y series favorita.</p>
      <Link to="/catalogo">Ver catálogo</Link>
    </div>
  )
}

export default Home