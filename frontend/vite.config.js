import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8001,
    host: true,
    watch: {
      usePolling: true
    },
    hmr: {
      clientPort: 8001
    },
    proxy: {
      '/api': {
        target: 'http://backend:8050',
        changeOrigin: true
      },
      '/storage': {
        target: 'http://backend:8050',
        changeOrigin: true
      }
    }
  }
})
