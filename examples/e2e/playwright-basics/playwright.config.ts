import { defineConfig, devices } from '@playwright/test'

// ---------------------------------------------------------------------------
// Playwright configuration
// ---------------------------------------------------------------------------
// - baseURL lets tests use relative paths like page.goto('/login')
// - Screenshots captured on failure for debugging
// - Trace recorded on first retry to diagnose flaky tests
// - The local Express server starts automatically via webServer config
// ---------------------------------------------------------------------------

export default defineConfig({
  // Look for test files in the src/ directory
  testDir: './src',

  // Run tests in parallel within each file
  fullyParallel: true,

  // Fail the build on CI if test.only is left in source code
  forbidOnly: !!process.env.CI,

  // Retry once on CI to catch flaky tests, zero retries locally
  retries: process.env.CI ? 1 : 0,

  // Limit parallel workers on CI to avoid resource contention
  workers: process.env.CI ? 1 : undefined,

  // Reporter: list for local dev, HTML report on CI
  reporter: process.env.CI ? 'html' : 'list',

  use: {
    // Base URL for all page.goto() calls — avoids repeating localhost everywhere
    baseURL: 'http://localhost:3210',

    // Capture screenshot on test failure for post-mortem debugging
    screenshot: 'only-on-failure',

    // Record trace on first retry — gives a full timeline of actions, network, DOM
    trace: 'on-first-retry',

    // Set a reasonable viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Configure the test browser
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start the Express app before running tests
  webServer: {
    command: 'npx tsx src/server.ts',
    url: 'http://localhost:3210',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
})
