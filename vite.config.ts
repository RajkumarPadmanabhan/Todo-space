import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // `PORT=5174 npm start` alongside `npm run dev` to try background alerts while developing.
    proxy: { '/api': 'http://127.0.0.1:5174' },
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
})
