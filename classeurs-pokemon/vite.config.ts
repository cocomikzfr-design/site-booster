import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' : le site marche dans n'importe quel dossier (GitHub Pages, sous-dossier, aperçu).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../classeurs',
    emptyOutDir: true,
  },
});
