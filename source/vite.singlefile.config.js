import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Build especial que genera UN SOLO archivo HTML autocontenido (JS y CSS
// inline), usado únicamente para publicar una vista previa interactiva
// (por ejemplo como Artifact). El deploy real (Netlify) usa vite.config.js.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: 'dist-singlefile',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 10000,
  },
})
