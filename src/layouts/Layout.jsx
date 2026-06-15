// src/layouts/Layout.jsx
import { Outlet } from 'react-router-dom';
import Header from '../components/Header'; // Tu componente de Header

function Layout() {
  return (
    <div className="app-container">
      {/* El Header se queda fijo arriba de todo */}
      <Header />

      {/* El main es el contenedor del contenido dinámico */}
      <main className="main-content">
        {/* Aquí adentro React Router va a inyectar la página de la URL actual */}
        <Outlet /> 
      </main>

      {/* El Footer se queda fijo abajo de todo */}
      <footer className="app-footer">
        <p>&copy; 2026 - Proyecto Benteveo. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default Layout;