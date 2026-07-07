import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
        // Hot Module Replacement configuration for development.
        hmr: process.env.DISABLE_HMR !== "true",

        // Disable file watching when requested.
        watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
