import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get repository name from environment or default to 'Tango-Solver'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'Tango-Solver'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages - automatically uses repo name from GitHub Actions
  // For local development, defaults to '/Tango-Solver/'
  base: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/',
})

