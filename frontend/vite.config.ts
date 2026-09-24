import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { handleCollegesSearchRequest } from '../backend/collegesHandler.js';

const frontendDir = fileURLToPath(new URL('.', import.meta.url));

function collegesApiPlugin(): Plugin {
  return {
    name: 'colleges-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/colleges/search')) {
          await handleCollegesSearchRequest(req, res);
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  root: frontendDir,
  // Load .env files from the project root (one level up from frontend/)
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  plugins: [react(), tailwindcss(), collegesApiPlugin()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
