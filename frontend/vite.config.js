import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'localhost',
      '.ngrok-free.app',        // Allows ALL ngrok-free.app subdomains
      '448a-196-189-31-45.ngrok-free.app'  // Your specific domain
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Add this to handle SVGs properly
  assetsInclude: ['**/*.svg']
})