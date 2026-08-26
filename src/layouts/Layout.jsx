// src/layouts/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Benti from '../components/Benti/Benti.jsx';
import styles from './Layout.module.css';

function Layout() {
  const [query, setQuery] = useState('');

  const handleSearch = (value) => {
    setQuery(value);
  };

  return (
    <div className={styles.appContainer}>
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Saltar al contenido
      </a>
      <Header query={query} onSearch={handleSearch} />

      <main id="main-content" tabIndex={-1} className={styles.mainContent}>
        <Outlet context={{ query, onSearch: handleSearch }} />
      </main>

      <Footer />
      <Benti />
    </div>
  );
}

export default Layout;