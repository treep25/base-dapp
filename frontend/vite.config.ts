import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration for Baseposting Bird Mini App
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
          web3: ['wagmi', 'viem'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});

