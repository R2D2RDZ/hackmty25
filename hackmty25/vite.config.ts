import { defineConfig } from 'vite'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173
  },
  build: {
    // Configura Rollup (el bundler interno de Vite) para múltiples entradas HTML
    rollupOptions: {
      input: {
        // La entrada principal (index.html, que está en la raíz)
        main: path.resolve(__dirname, 'index.html'), 
        // La entrada secundaria (bonificaciones.html, que moviste a public/)
        bonificaciones: path.resolve(__dirname, 'public/bonificaciones.html'),
      },
    },
  },
})
