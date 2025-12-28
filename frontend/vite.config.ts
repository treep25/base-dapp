import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration for Flappy Bird Base Mini App
 * 
 * Optimizations:
 * - Phaser is externalized for better caching
 * - Build output is optimized for Mini App deployment
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Target modern browsers for Base App
    target: 'esnext',
    // Output directory for deployment
    outDir: 'dist',
    // Generate sourcemaps for debugging
    sourcemap: true,
    rollupOptions: {
      output: {
        // Separate vendor chunks for better caching
        manualChunks: {
          phaser: ['phaser'],
          web3: ['wagmi', 'viem'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  // Development server configuration
  server: {
    port: 5173,
    host: true,
  },
});

