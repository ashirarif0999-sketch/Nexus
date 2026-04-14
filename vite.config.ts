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
        manualChunks: (id) => {
          // Separate React core into its own chunk
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react';
          }
          // Separate UI icons library
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // Separate date handling
          if (id.includes('date-fns')) {
            return 'vendor-date';
          }
          // Separate HTTP client
          if (id.includes('axios')) {
            return 'vendor-http';
          }
        },
      },
    },
  },
});
