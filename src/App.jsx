import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import RequireAuth from './components/RequireAuth.jsx'

// Code-splitting por ruta: cada página se descarga bajo demanda,
// reduciendo el tamaño del chunk inicial.
const Home = lazy(() => import('./pages/Home.jsx'))
const PageCatalogo = lazy(() => import('./pages/PageCatalogo.jsx'))
const DetalleProducto = lazy(() => import('./pages/DetalleProducto.jsx'))
const Reservation = lazy(() => import('./pages/Reservation.jsx'))
const Pago = lazy(() => import('./pages/Pago.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Registro = lazy(() => import('./pages/Registro.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const DemoModales = lazy(() => import('./pages/DemoModales.jsx'))
const MisReservas = lazy(() => import('./pages/MisReservas.jsx'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Cargando">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
    </div>
  )
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Páginas públicas con header + footer */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explorar" element={<PageCatalogo />} />
            <Route path="/detalle/:id" element={<DetalleProducto />} />
            <Route path="/reservation/:id" element={<RequireAuth><Reservation /></RequireAuth>} />
            <Route path="/reservas" element={<RequireAuth><MisReservas /></RequireAuth>} />
            <Route path="/pago" element={<RequireAuth><Pago /></RequireAuth>} />
            <Route path="/demo-modales" element={<DemoModales />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* Autenticación: sin header/footer, solo botón de volver */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registro />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
