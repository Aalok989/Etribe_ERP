import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({     // Hide internal Vite logs
  clearScreen: false,     // Prevent Vite from clearing console

  client: {
    logging: "error",     // Hides: [vite] hot updated ... (ONLY errors will show)
  },

  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'https://api.etribes.mittalservices.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
    },
    hmr: {
      overlay: false,     // Stop error overlay popping on screen
    },
  },

  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          utils: ['axios', 'react-toastify'],
        },
      },
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'html2pdf.js'],
  },
});
