import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs'

/**
 * 自定义插件:复制 manifest.json 和 icons 文件夹到构建目录
 * Chrome 扩展需要 manifest.json 文件和图标在根目录
 */
const copyManifest = () => {
  return {
    name: 'copy-manifest',
    writeBundle() {
      // 复制 manifest.json
      copyFileSync('manifest.json', 'dist/manifest.json')
      console.log('✓ manifest.json 已复制到 dist 目录')

      // 复制 icons 文件夹
      const iconsDir = 'icons'
      const distIconsDir = 'dist/icons'

      if (existsSync(iconsDir)) {
        // 创建 dist/icons 目录
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir, { recursive: true })
        }

        // 复制所有图标文件
        const files = readdirSync(iconsDir)
        files.forEach((file) => {
          copyFileSync(`${iconsDir}/${file}`, `${distIconsDir}/${file}`)
        })

        console.log('✓ icons 文件夹已复制到 dist 目录')
      }
    },
  }
}

/**
 * Vite 配置
 * 支持开发模式和生产模式
 */
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    base: './', // 使用相对路径（Chrome 扩展必需）
    plugins: [
      vue(), // Vue3 支持
      Icons({
        // Unplugin Icons 支持
        compiler: 'vue3',
        autoInstall: true, // 自动安装图标集
      }),
      AutoImport({
        // 自动引入 Vue 3 和 Pinia API
        imports: [
          'vue',
          'pinia',
          {
            // 自定义引入（根据需要添加）
            // '@/stores/yourStore': ['useYourStore'],
          },
        ],
        dts: 'src/auto-imports.d.ts', // 生成类型声明文件
        eslintrc: {
          enabled: true, // 生成 ESLint 配置
          filepath: '.eslintrc-auto-import.json',
        },
      }),
      copyManifest(), // 复制 manifest.json
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'), // @ 指向 src 目录
      },
    },
    build: {
      rollupOptions: {
        // 多入口配置 - Chrome 扩展的不同脚本
        input: {
          popup: resolve(__dirname, 'popup.html'), // 弹窗页面
          content: resolve(__dirname, 'src/content/index.js'), // 内容脚本
          background: resolve(__dirname, 'src/background.js'), // 后台脚本
        },
        output: {
          // 输出文件命名格式(不使用 hash,保持文件名与 manifest.json 一致)
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
      // 生产模式配置（使用 esbuild，Vite 内置无需额外安装）
      minify: isProduction ? 'esbuild' : false,
      sourcemap: !isProduction,
    },
    // 开发服务器配置
    server: {
      port: 5173,
      open: '/popup.html', // 自动打开 popup 页面
    },
  }
})
