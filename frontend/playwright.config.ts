import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/learning-ui',
  testMatch: '*.spec.ts',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5178', headless: true, channel: 'msedge' },
  webServer: {
    command: 'npx vite --config tests/learning-ui/vite.config.ts',
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: false,
  },
  reporter: 'list',
});
