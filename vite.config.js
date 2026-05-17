import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs'

const copyManifest = () => {
  return {
    name: 'copy-manifest',
    writeBundle() {
      copyFileSync('manifest.json', 'dist/manifest.json')

      const iconsDir = 'icons'
      const distIconsDir = 'dist/icons'
      if (existsSync(iconsDir)) {
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir, { recursive: true })
        }

        const files = readdirSync(iconsDir)
        files.forEach((file) => {
          copyFileSync(`${iconsDir}/${file}`, `${distIconsDir}/${file}`)
        })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    base: './',
    plugins: [
      vue(),
      Icons({
        compiler: 'vue3',
        autoInstall: true,
      }),
      AutoImport({
        imports: ['vue', 'pinia'],
        dts: 'src/auto-imports.d.ts',
        eslintrc: {
          enabled: true,
          filepath: '.eslintrc-auto-import.json',
        },
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts',
      }),
      copyManifest(),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          newtab: resolve(__dirname, 'newtab.html'),
          background: resolve(__dirname, 'src/background.js'),
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/vue')) return 'vue-vendor'
            if (id.includes('node_modules/pinia')) return 'vue-vendor'
            if (id.includes('node_modules/axios')) return 'request-vendor'
          },
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
      minify: isProduction ? 'esbuild' : false,
      sourcemap: !isProduction,
    },
    server: {
      port: 5173,
      open: '/newtab.html',
    },
  }
})
