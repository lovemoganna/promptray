import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Allow overriding base via env (VITE_BASE) so GitHub Actions can set repo-specific base for project pages.
    base: env.VITE_BASE || './',
    define: {
      // Map the build-time environment variable to process.env.API_KEY
      // We look for VITE_API_KEY first (standard), then fall back to GEMINI_API_KEY
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.GEMINI_API_KEY || process.env.API_KEY),
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // Ensure empty output directory before build
      emptyOutDir: true,
    }
  };
});