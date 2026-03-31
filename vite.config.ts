import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React core into its own chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Separate UI icons library
          'vendor-icons': ['lucide-react'],
          // Separate date handling
          'vendor-date': ['date-fns'],
          // Separate HTTP client
          'vendor-http': ['axios'],
        },
      },
    },
  },
});
