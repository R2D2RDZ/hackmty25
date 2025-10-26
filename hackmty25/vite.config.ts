// vite.config.ts

import { defineConfig } from 'vite';

export default defineConfig({
  // Aquí es donde defines tu configuración de Vite.
  // Para una aplicación "Vanilla JS" pura (sin frameworks), 
  // esto puede ser un objeto vacío o con una configuración mínima.
  plugins: [],
  build: {
    // Si necesitas especificar el directorio de salida (generalmente 'dist')
    outDir: 'dist',
  }
});