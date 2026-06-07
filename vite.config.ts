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
        id: '/',
        prefer_related_applications: false,
        related_applications: [],
        iarc_rating_id: 'e5841cb6-af4f-5172-98ea-757efa4da622',
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
        ],
        screenshots: [
          {
            src: 'screenshot-1.png',
            sizes: '545x960',
            type: 'image/png',
            form_factor: 'narrow'
          },
          {
            src: 'screenshot-2.png',
            sizes: '519x967',
            type: 'image/png',
            form_factor: 'narrow'
          },
          {
            src: 'screenshot-3.png',
            sizes: '513x954',
            type: 'image/png',
            form_factor: 'narrow'
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
