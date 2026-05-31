import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon/**/*', 'logo1/**/*'],
      manifest: {
        name: 'QA Test Case Studio',
        short_name: 'QA Studio',
        description: 'Modern QA Test Case Management Application',
        theme_color: '#0F1629',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: '/favicon/convertico-favicon_128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: '/favicon/convertico-favicon_256x256.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: '/logo1/convertico-favicon_256x256.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        navigateFallback: '/',
        navigateFallbackAllowlist: [/^\/[^_]*$/],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'external-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
})
