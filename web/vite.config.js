import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { metaApiPlugin } from './vite-plugin-meta-api.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === 'development' ? metaApiPlugin() : null].filter(Boolean),
  base: mode === 'production' ? '/PokemonChampions/' : '/',
  resolve: {
    alias: {
      '@data': path.resolve(__dirname, '../data/M-B'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
}))
