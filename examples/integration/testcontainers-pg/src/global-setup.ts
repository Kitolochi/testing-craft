import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'

// ---------------------------------------------------------------------------
// Vitest globalSetup — PostgreSQL Testcontainer lifecycle
// ---------------------------------------------------------------------------
// This file runs ONCE before all test files and ONCE after all test files.
//
// Setup:
//   1. Pulls the postgres:16-alpine Docker image (first run only)
//   2. Starts a PostgreSQL container with a random host port
//   3. Exposes the connection URI as an environment variable so tests can
//      connect without hardcoding ports
//
// Teardown:
//   1. Stops the container and removes it (automatic cleanup)
//
// Why globalSetup instead of beforeAll?
//   - Container startup is slow (~5-10s). Starting once and sharing across
//     all test files is faster than starting per-file or per-test.
//   - globalSetup runs in a separate worker, so we pass the connection
//     string through process.env rather than module-level variables.
// ---------------------------------------------------------------------------

let container: StartedPostgreSqlContainer

export async function setup() {
  // Start a PostgreSQL 16 container with Alpine for smaller image size
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('testdb')
    .withUsername('testuser')
    .withPassword('testpass')
    .start()

  // Expose the connection URI so test files can pick it up
  // Format: postgresql://testuser:testpass@localhost:PORT/testdb
  process.env.DATABASE_URL = container.getConnectionUri()

  console.log(`PostgreSQL container started at ${container.getConnectionUri()}`)
}

export async function teardown() {
  // Stop the container — testcontainers removes it automatically
  await container.stop()
  console.log('PostgreSQL container stopped')
}
