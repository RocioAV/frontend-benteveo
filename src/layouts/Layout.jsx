// src/layouts/Layout.jsx
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Layout() {
  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <Outlet /> 
      </main>

      <Footer />
    </div>
  );
}

export default Layout;