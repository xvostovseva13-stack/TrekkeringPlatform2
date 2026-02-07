import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['@electron-toolkit/utils'] })],
    build: {
      rollupOptions: {
        external: ['@prisma/client', '.prisma/client'],
        input: {
          index: resolve(__dirname, 'src/main.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: ['@electron-toolkit/preload'] })],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    // This is the crucial part:
    // Point the renderer to the 'core' package's index.html and src
    root: resolve('../core'),
    build: {
      outDir: resolve(__dirname, 'out/renderer'),
      rollupOptions: {
        input: resolve('../core/index.html')
      }
    },
    plugins: [react()],
    optimizeDeps: {
      exclude: ['react-grid-layout']
    }
  }
})
