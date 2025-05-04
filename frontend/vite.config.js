import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { readFileSync } from 'fs';

// Get package version from package.json
const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

export default defineConfig({
  plugins: [vue()],
  define: {
    // Make app version available in the client code
    '__APP_VERSION__': JSON.stringify(packageJson.version),
  },
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
