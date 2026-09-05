import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleCollegesSearchRequest } from './backend/collegesHandler.js';

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
  plugins: [react(), tailwindcss(), collegesApiPlugin()],
});
