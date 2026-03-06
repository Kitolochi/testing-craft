export interface Row {
  [key: string]: unknown
}

/**
 * Execute a parameterized SQL query against the database.
 * In production this would use a real connection pool.
 */
export async function query(sql: string, params: unknown[] = []): Promise<Row[]> {
  // Placeholder — replaced by vi.mock in tests
  throw new Error(`Not implemented: query(${sql}, ${JSON.stringify(params)})`)
}

/**
 * Execute a SQL statement that doesn't return rows (INSERT, UPDATE, DELETE).
 */
export async function execute(sql: string, params: unknown[] = []): Promise<{ affectedRows: number }> {
  throw new Error(`Not implemented: execute(${sql}, ${JSON.stringify(params)})`)
}
