import './App.css'
import Reservation from './pages/Reservation.jsx'
import DetalleProducto from './pages/DetalleProducto.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Layout from './layouts/Layout.jsx'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import PageCatalogo from './pages/PageCatalogo.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explorar" element={<PageCatalogo />} />
          <Route path="/detalle/:id" element={<DetalleProducto />} />
          <Route path="/reservation/:id" element={<Reservation />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registro />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
