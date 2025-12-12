import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/promptray/', // 你的仓库名
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // 便于调试
  },
  server: {
    port: 3000,
  },
  define: {
    // 确保环境变量正确传递到客户端
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || ''),
  }
})
