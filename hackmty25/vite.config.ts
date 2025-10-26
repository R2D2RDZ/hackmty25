// vite.config.ts

import { defineConfig } from 'vite';

export default defineConfig({
  // Establece la URL base para el despliegue
  base: './', // <--- ¡Asegúrate de que esta línea esté presente!
  
  // Puedes dejar el resto de la configuración vacío o con tus plugins
  plugins: [],
});