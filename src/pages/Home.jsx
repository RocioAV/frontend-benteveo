
import heroImg from '../assets/hero.png'

function Home() {
  return (
    <div className="home">
      <h1>Bienvenido a Benteveo</h1>
      <p>Tu plataforma de streaming de películas y series favorita.</p>
      <img src={heroImg} alt="Hero" className="hero-image" />
    </div>
  )
}
export default Home