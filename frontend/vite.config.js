import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration with responsive breakpoints support
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Exposes the server to the local network (allows mobile access)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
