import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  build: { target: 'es2022', cssCodeSplit: true },
  test: { environment: 'jsdom', setupFiles: [fileURLToPath(new URL('./src/test/setup.ts', import.meta.url))] },
});
