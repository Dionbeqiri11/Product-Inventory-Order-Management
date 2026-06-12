import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // mongodb-memory-server download/startup can be slow on first run.
    hookTimeout: 120_000,
    testTimeout: 30_000,
    // DB state is shared across files; run serially for isolation.
    fileParallelism: false,
  },
});
