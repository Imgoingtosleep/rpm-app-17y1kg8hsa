import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1000,
    host: true,
    watch: {
      usePolling: true
    },
    hmr: {
      clientPort: 1000
    },
    proxy: {
      '/api': {
        target: 'http://backend:1050',
        changeOrigin: true
      },
      '/storage': {
        target: 'http://backend:1050',
        changeOrigin: true
      }
    }
  }
})
