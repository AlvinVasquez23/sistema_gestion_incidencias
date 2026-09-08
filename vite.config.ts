import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Adecco Punta Negra · Gestión de Incidencias',
        short_name: 'Incidencias',
        description: 'Sistema de gestión de incidencias FaPe Punta Negra',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#10131a',
        theme_color: '#E30613',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
})