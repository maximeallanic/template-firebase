import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Drop console.log and debugger in production builds
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    // Optimize chunk splitting for better caching and tree-shaking
    rollupOptions: {
      // Fix circular dependency issues with Firebase modules
      preserveEntrySignatures: 'allow-extension',

      output: {
        // Disable hoisting to prevent circular dependency initialization errors
        hoistTransitiveImports: false,

        // Merge chunks smaller than 15KB for better parallel loading
        experimentalMinChunkSize: 15000,
        compact: true, // Remove whitespace

        // Custom chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          // Vite helpers in separate chunk to avoid conflicts
          if (chunkInfo.name.startsWith('vite/') || chunkInfo.name.startsWith('\x00vite/')) {
            return 'assets/vite-[name]-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },

        manualChunks: (id) => {
          // CRITICAL: Bundle @firebase/app with its direct dependencies and Auth
          // This prevents circular dependency initialization issues
          // @firebase/auth depends on @firebase/app, so they must be in same chunk
          if (
            id.includes('@firebase/app') ||
            id.includes('@firebase/util') ||
            id.includes('@firebase/logger') ||
            id.includes('@firebase/component') ||
            id.includes('firebase/auth') ||
            id.includes('@firebase/auth')
          ) {
            return 'firebase-core';
          }

          // Firestore - Lazy load after auth (safe to separate)
          if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
            return 'firebase-db';
          }

          // Functions - Lazy load for analyses (safe to separate)
          if (id.includes('firebase/functions') || id.includes('@firebase/functions')) {
            return 'firebase-functions';
          }

          // Analytics - Defer completely (dynamic import already implemented)
          if (id.includes('firebase/analytics') || id.includes('@firebase/analytics')) {
            return 'firebase-analytics';
          }

          // Framer Motion - Large animation library, separate chunk for better caching
          if (id.includes('framer-motion')) {
            return 'framer-motion';
          }

          // Lucide React icons - Separate chunk (tree-shaking friendly)
          if (id.includes('lucide-react')) {
            return 'icons';
          }

          // React core + Router - MUST be in same chunk to avoid createContext errors
          // React Router calls React.createContext() during module init
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('react-router') ||
            id.includes('@remix-run/router') ||
            id.includes('scheduler')
          ) {
            return 'react-core';
          }

          // All other node_modules in single vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Use esbuild for 10-100x faster minification with excellent results
    minify: 'esbuild',
    target: 'es2020',
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 500,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Disable sourcemaps for smaller builds
    sourcemap: false,
    // Optimize asset inlining threshold
    assetsInlineLimit: 4096, // Inline assets < 4KB as base64
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/functions',
    ],
    // Exclude heavy dependencies from pre-bundling
    exclude: ['firebase/analytics'],
  },
  // Server configuration for development
  server: {
    // Pre-transform known dependencies for faster initial dev server startup
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/HomePage.tsx',
      ],
    },
  },
})
