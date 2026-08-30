import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SkyRoster — Smart Shift Planner',
        short_name: 'SkyRoster',
        description: 'Plan, visualize, and export shift rosters with team collaboration',
        theme_color: '#2563EB',
        background_color: '#070D1A',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('lucide-react') || id.includes('framer-motion') || id.includes('react-hot-toast')) return 'vendor-ui';
            return 'vendor-libs';
          }
        }
      }
    }
  }
})
