import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./', import.meta.url));
const auth = fileURLToPath(new URL('./auth.ts', import.meta.url));
export default defineConfig({
  root,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /.*\/hooks\/useAuth$/, replacement: auth },
      { find: '@clerk/clerk-react', replacement: auth },
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 5178,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('../../../', import.meta.url))] },
  },
  envDir: fileURLToPath(new URL('../../../', import.meta.url)),
});
