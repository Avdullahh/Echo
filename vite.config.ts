import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// FIX: Define __dirname for ES Modules
const root = process.cwd();

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Pointing to the files relative to the project root
        popup: resolve(root, 'index.html'),
        dashboard: resolve(root, 'dashboard.html'),
        background: resolve(root, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})