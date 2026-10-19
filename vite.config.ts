import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// base 用 './'：仓库名/用户名未定也能构建，GitHub Pages 子路径部署无 404 资源问题
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // Windows + junction 路径下，HTML 入口默认名会被解析成绝对路径，
      // 触发 rollup "fileName must not be absolute" 报错；显式命名可规避
      input: { index: resolve(__dirname, 'index.html') }
    }
  },
  server: {
    port: 5173,
    host: true,
    // 本地也能打真实接口：/proxy/* → https://oa.upingbio.cn/*
    // 线上由 Worker 做同样的事（见 proxy/worker.js）
    proxy: {
      '/proxy': {
        target: 'https://oa.upingbio.cn',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/proxy/, ''),
        headers: {
          Referer: 'https://oa.upingbio.cn/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin') // 过 WAF 关键
          })
          proxy.on('proxyRes', (proxyRes) => {
            const sc = proxyRes.headers['set-cookie']
            if (!sc) return
            proxyRes.headers['set-cookie'] = sc.map((c) =>
              c
                .replace(/;\s*domain=[^;]*/gi, '')
                .replace(/;\s*samesite=[^;]*/gi, '; SameSite=Lax')
            )
          })
        }
      }
    }
  }
})
