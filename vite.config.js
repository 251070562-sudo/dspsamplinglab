import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolves @babel/runtime/helpers/esm/* bare specifiers used by @react-three/fiber.
 */
function babelRuntimeEsmPlugin() {
  return {
    name: 'babel-runtime-esm-alias',
    resolveId(id) {
      if (id.startsWith('@babel/runtime/helpers/esm/')) {
        const helper = id.slice('@babel/runtime/helpers/esm/'.length);
        return path.resolve(__dirname, `node_modules/@babel/runtime/helpers/esm/${helper}.js`);
      }
      return null;
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), babelRuntimeEsmPlugin()],

  build: {
    sourcemap: false,       // no source maps in production builds
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    // Prevent accidental .env exposure
    rollupOptions: {
      output: {
        // no manualChunks — keep single bundle for CreatorCode compatibility
      },
    },
  },

  // Dev server security — restrict to localhost only
  server: {
    host: 'localhost',
    strictPort: false,
    // Restrict HMR to local network only
    hmr: { host: 'localhost' },
  },

  optimizeDeps: {
    include: ['@react-three/fiber'],
  },

  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js', 'src/**/*.test.js'],
  },
});
