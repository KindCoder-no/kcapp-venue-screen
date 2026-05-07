import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const normalizeBasePath = (value?: string): string => {
  if (!value || value.trim() === '') {
    return '/';
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
};

// https://vitejs.dev/config/
export default defineConfig({
  base: normalizeBasePath(process.env.VITE_APP_BASE_PATH),
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://darts.sanden.cloud',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
