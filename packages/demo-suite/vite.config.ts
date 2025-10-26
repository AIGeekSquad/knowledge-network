import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Build configuration optimized for demo deployment
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          // Vendor chunk for stable caching
          vendor: ['d3'],
          // Knowledge-network library separate chunk
          'knowledge-network': ['@aigeeksquad/knowledge-network']
        }
      }
    },
    // Asset optimization
    assetsInlineLimit: 4096, // Inline small assets
    chunkSizeWarningLimit: 1000 // Reasonable chunk size warning
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external access
    open: true, // Auto-open browser
    cors: true,
    hmr: {
      overlay: true // Show errors/warnings as overlay
    }
  },

  // Preview server (for production build testing)
  preview: {
    port: 3001,
    host: true,
    open: true
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'd3',
      '@aigeeksquad/knowledge-network'
    ]
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },

  // Plugin configuration
  plugins: [
    // No framework plugins - pure TypeScript/web components approach
  ],

  // CSS configuration
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  },


  // Performance monitoring
  esbuild: {
    target: 'esnext',
    keepNames: true // Preserve function names for debugging
  }
});