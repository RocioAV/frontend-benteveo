import './App.css'
import Reservation from './pages/Reservation.jsx'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Layout from './layouts/Layout.jsx'
import Login from './pages/Login.jsx'

function App() {
  return (
    <Routes>
      {/* Envolvemos TODAS las rutas dentro del Layout común */}
      <Route element={<Layout />}>
        
        {/* Rutas individuales */}
        <Route path="/" element={<Home />} />
        <Route path="/reservation/:id" element={<Reservation />} />
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  )
}

export default App
