import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// base 用 './'：仓库名/用户名未定也能构建，GitHub Pages 子路径部署无 404 资源问题
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 2000
  },
  server: {
    port: 5173,
    host: true
  }
})
