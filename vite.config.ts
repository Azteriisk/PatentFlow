import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/uspto-api': {
        target: 'https://api.uspto.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uspto-api/, ''),
        secure: false,
      },
      '/tsdr-api': {
        target: 'https://tsdrapi.uspto.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tsdr-api/, ''),
        secure: false,
      }
    }
  }
})
