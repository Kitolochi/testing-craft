import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Testcontainers needs extra time to pull images and start the container
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Run test files sequentially — they share a single database container
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Global setup starts the PostgreSQL container before any tests run
    globalSetup: ['./src/global-setup.ts'],
  },
})
