import './App.css'
// import Header from './components/header.jsx'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Layout from './layouts/Layout.jsx'
import PageCatalogo from './pages/PageCatalogo.jsx'

function App() {
  return (
    <Routes>
      {/* Envolvemos TODAS las rutas dentro del Layout común */}
      <Route element={<Layout />}>
        
        {/* Rutas individuales */}
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<PageCatalogo />} />
        
      </Route>
    </Routes>
  )
}

export default App
