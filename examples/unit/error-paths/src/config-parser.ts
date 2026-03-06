import { ConfigError, ValidationError } from './errors'

export interface AppConfig {
  name: string
  version: string
  port: number
  database: {
    host: string
    port: number
  }
}

/**
 * Parse and validate a JSON configuration string.
 */
export function parseConfig(raw: string): AppConfig {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ConfigError('Invalid JSON in configuration', 'config.json')
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new ConfigError('Configuration must be a JSON object')
  }

  const obj = parsed as Record<string, unknown>

  // Required string fields
  if (!obj.name || typeof obj.name !== 'string') {
    throw new ValidationError('Missing required field: name', 'name')
  }

  if (obj.name.trim().length === 0) {
    throw new ValidationError('Field "name" must not be empty', 'name')
  }

  if (!obj.version || typeof obj.version !== 'string') {
    throw new ValidationError('Missing required field: version', 'version')
  }

  // Port validation
  if (obj.port === undefined) {
    throw new ValidationError('Missing required field: port', 'port')
  }

  const port = Number(obj.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ValidationError(
      `Invalid port: ${obj.port}. Must be an integer between 1 and 65535`,
      'port',
    )
  }

  // Database config
  if (!obj.database || typeof obj.database !== 'object') {
    throw new ValidationError('Missing required field: database', 'database')
  }

  const db = obj.database as Record<string, unknown>

  if (!db.host || typeof db.host !== 'string') {
    throw new ValidationError('Missing required field: database.host', 'database.host')
  }

  const dbPort = Number(db.port)
  if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new ValidationError(
      `Invalid database port: ${db.port}`,
      'database.port',
    )
  }

  return {
    name: obj.name as string,
    version: obj.version as string,
    port,
    database: {
      host: db.host as string,
      port: dbPort,
    },
  }
}

/**
 * Load config from a string, returning a result type instead of throwing.
 */
export function tryParseConfig(
  raw: string,
): { ok: true; config: AppConfig } | { ok: false; error: string } {
  try {
    const config = parseConfig(raw)
    return { ok: true, config }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
