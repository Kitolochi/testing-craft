// ---------------------------------------------------------------------------
// Functions that produce serializable output — good candidates for snapshots
// ---------------------------------------------------------------------------

export interface ApiUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: string
}

/**
 * Normalize an API response into a consistent internal shape.
 * Snapshot testing catches unexpected changes to the transform logic.
 */
export function normalizeUser(raw: Record<string, unknown>): ApiUser {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? 'Unknown'),
    email: String(raw.email ?? '').toLowerCase(),
    role: (['admin', 'editor', 'viewer'].includes(raw.role as string)
      ? raw.role
      : 'viewer') as ApiUser['role'],
    createdAt: String(raw.created_at ?? raw.createdAt ?? new Date(0).toISOString()),
  }
}

/**
 * Build a database config object from environment-like inputs.
 * The full shape is tedious to assert field-by-field — snapshots are ideal.
 */
export function buildDbConfig(env: Record<string, string | undefined>) {
  return {
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    database: env.DB_NAME ?? 'app_dev',
    user: env.DB_USER ?? 'postgres',
    password: env.DB_PASSWORD ?? '',
    ssl: env.DB_SSL === 'true',
    pool: {
      min: Number(env.DB_POOL_MIN ?? 2),
      max: Number(env.DB_POOL_MAX ?? 10),
      idleTimeoutMs: 30_000,
    },
    migrations: {
      directory: './migrations',
      tableName: 'schema_migrations',
    },
  }
}

/**
 * Categorize HTTP status codes into human-readable error messages.
 * Snapshot testing locks down every branch at once.
 */
export function describeHttpError(status: number): string {
  if (status >= 200 && status < 300) return 'Success'
  if (status === 400) return 'Bad Request: the server could not understand your request'
  if (status === 401) return 'Unauthorized: authentication is required'
  if (status === 403) return 'Forbidden: you do not have permission to access this resource'
  if (status === 404) return 'Not Found: the requested resource does not exist'
  if (status === 409) return 'Conflict: the request conflicts with the current state'
  if (status === 422) return 'Unprocessable Entity: the request was well-formed but invalid'
  if (status === 429) return 'Too Many Requests: you have exceeded the rate limit'
  if (status >= 500 && status < 600) return `Server Error (${status}): an internal error occurred`
  return `Unexpected status ${status}`
}

/**
 * Generate a CSV string from an array of objects.
 * Multi-line string output is a natural fit for snapshot testing.
 */
export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? '')
        return val.includes(',') ? `"${val}"` : val
      }).join(','),
    ),
  ]
  return lines.join('\n')
}
