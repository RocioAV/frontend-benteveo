import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Pago from './pages/Pago.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pago" element={<Pago />} />
        <Route path="/" element={<h1>Benteveo - Home</h1>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
