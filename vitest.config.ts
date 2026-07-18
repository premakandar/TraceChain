import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@creit-tech/stellar-wallets-kit/sdk/modules/utils.js': path.resolve(__dirname, './src/__tests__/mockUtils.ts'),
    },
  },
});
