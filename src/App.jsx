import './App.css'
import Reservation from './pages/Reservation.jsx'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Layout from './layouts/Layout.jsx'
import Login from './pages/Login.jsx'
import PageCatalogo from './pages/PageCatalogo.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explorar" element={<PageCatalogo />} />
        <Route path="/reservation/:id" element={<Reservation />} />
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  )
}

export default App