import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Property 'cwd' does not exist on type 'Process' in some environments, casting to any.
  const env = loadEnv(mode, (process as any).cwd(), '')

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY so it's accessible in the browser
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
      // Polyfill process.env.NODE_ENV
      'process.env.NODE_ENV': JSON.stringify(mode),
    }
  }
})