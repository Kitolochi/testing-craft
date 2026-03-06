import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',

      // Thresholds — CI fails if not met
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,
      },

      // What to measure
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/index.ts',
        'src/**/*.config.*',
        'src/test/**',
        'src/mocks/**',
      ],
    },
  },
})
