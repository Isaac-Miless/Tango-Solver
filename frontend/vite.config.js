import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages - change 'Tango-Solver' to your repo name if different
  base: process.env.NODE_ENV === 'production' ? '/Tango-Solver/' : '/',
})

