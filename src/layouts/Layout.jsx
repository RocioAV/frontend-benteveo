// src/layouts/Layout.jsx
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout() {
  return (
    <div className="app-container">
      <ScrollToTop />
      <Header />

      <main className="main-content">
        <Outlet /> 
      </main>

      <Footer />
    </div>
  );
}

export default Layout;