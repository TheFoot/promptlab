import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3131',
        changeOrigin: true,
      },
      '/api/chat/ws': {
        target: 'ws://localhost:3131',
        ws: true,
      }
    },
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        charset: false,
        quietDeps: true, // Suppress deprecation warnings from dependencies
      },
    },
  },
});
