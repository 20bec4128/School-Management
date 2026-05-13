import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawApiBaseUrl = String(env.VITE_API_BASE_URL || '').trim()
  const proxyTarget = (() => {
    if (!rawApiBaseUrl) return 'http://localhost:8086'
    try {
      return new URL(rawApiBaseUrl).origin
    } catch {
      return 'http://localhost:8086'
    }
  })()

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    optimizeDeps: {
      esbuildOptions: {
        sourcemap: false,
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
