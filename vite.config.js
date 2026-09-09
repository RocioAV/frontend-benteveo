import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  css: {
    modules: {
      // Genera alias camelCase además de las claves originales (kebab/BEM).
      // Los componentes acceden styles.bvHeader / styles.productCardButton,
      // pero el CSS source usa .bv-header / .product-card__button.
      localsConvention: 'camelCase',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
