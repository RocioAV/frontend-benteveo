import { Link } from 'react-router-dom'
import heroImg from '../assets/hero.png'

function Home() {
  return (
    <div className="home">
      <h1>Bienvenido a Benteveo</h1>
      <p>Alquila wacho</p>
      <Link to="/catalogo">Ver catalogo</Link>
      <img src={heroImg} alt="Hero" className="hero-image" />
    </div>
  )
}

export default Home
