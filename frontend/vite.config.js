import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build optimizations
  build: {
    // Generate source maps for debugging in production
    sourcemap: false,

    // Warn if chunks exceed this size (in KB)
    chunkSizeWarningLimit: 500,

    // Rollup options for manual chunking
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core - rarely changes, cache separately
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // FullCalendar - only needed on appointment pages
          'vendor-calendar': [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/interaction'
          ],

          // Bootstrap - styling framework
          'vendor-bootstrap': ['bootstrap', 'react-bootstrap'],

          // PDF and Excel - only needed for reports
          'vendor-docs': ['jspdf', 'jspdf-autotable', 'xlsx'],

          // Icons - loaded across many pages
          'vendor-icons': ['lucide-react', 'react-icons'],
        },

        // Use content hash in filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Minification settings
    minify: 'esbuild',

    // Target modern browsers for smaller output
    target: 'es2020',
  },

  // Development server optimizations
  server: {
    // Enable HMR
    hmr: true,

    // Open browser on start
    open: false,

    // Fix for Google Login Cross-Origin-Opener-Policy warning
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'bootstrap',
    ],
  },
})
