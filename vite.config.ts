import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const root = process.cwd();

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Renamed index.html to popup.html
        popup: resolve(root, 'popup.html'),
        dashboard: resolve(root, 'dashboard.html'),
        onboarding: resolve(root, 'onboarding.html'),
        background: resolve(root, 'src/background/index.ts'),
        cookiebanner: resolve(root, 'src/content/cookiebanner.ts'),
        // Ad blocker split into two scripts for CSP bypass
        'adblocker-main': resolve(root, 'src/content/adblocker-main.ts'),
        'adblocker-isolated': resolve(root, 'src/content/adblocker-isolated.ts'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})