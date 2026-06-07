import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-512x512.png', 'icon-192x192.png'],
      manifest: {
        name: 'PatentFlow',
        short_name: 'PatentFlow',
        description: 'Cross-platform patent and trademark discovery application.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait-primary',
        categories: ['productivity', 'utilities', 'business'],
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
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
