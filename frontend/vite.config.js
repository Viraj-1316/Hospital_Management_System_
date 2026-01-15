import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Pre-compress with gzip for production
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files > 1KB
    }),
    // Pre-compress with brotli for modern browsers
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
  ],

  // Build optimizations
  build: {
    // Generate source maps for debugging in production
    sourcemap: false,

    // Warn if chunks exceed this size (in KB)
    chunkSizeWarningLimit: 500,

    // Use lightningcss for faster CSS minification
    cssMinify: 'lightningcss',

    // Ensure CSS is split by component
    cssCodeSplit: true,

    // Rollup options for manual chunking
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core - rarely changes, cache separately
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // FullCalendar - only needed on appointment pages (~260KB)
          'vendor-calendar': [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/interaction',
            '@fullcalendar/list'
          ],

          // Bootstrap - styling framework
          'vendor-bootstrap': ['bootstrap', 'react-bootstrap'],

          // PDF generation - split separately (large library)
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],

          // Excel generation - split separately (~440KB library)
          'vendor-excel': ['exceljs'],

          // Rich text editor - only needed for forms with rich text
          'vendor-quill': ['react-quill-new'],

          // Icons - loaded across many pages
          'vendor-icons': ['lucide-react', 'react-icons'],

          // HTTP client
          'vendor-axios': ['axios'],

          // Sockets
          'vendor-socket': ['socket.io-client'],

          // HTML to canvas - for PDF screenshots
          'vendor-html2canvas': ['html2canvas'],
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
