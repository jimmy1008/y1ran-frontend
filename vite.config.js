import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __GIT_SHA__: JSON.stringify(process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_SHA || 'dev'),
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.y1ran.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
