import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get repository name from environment variable (set by GitHub Actions)
// Format: "username/repo-name" -> extract "repo-name"
const getBasePath = () => {
  // In GitHub Actions, GITHUB_REPOSITORY is set (e.g., "username/Tango-Solver")
  if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1]
    return `/${repoName}/`
  }
  
  // For local development, use root path
  return '/'
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages - automatically uses repo name from GitHub Actions
  // For local development, uses root path '/'
  base: getBasePath(),
})

