import { describe, it, expect } from 'vitest'
import { parseConfig, tryParseConfig } from './config-parser'
import { ConfigError, ValidationError, NotFoundError } from './errors'

const validConfig = JSON.stringify({
  name: 'my-app',
  version: '1.0.0',
  port: 3000,
  database: { host: 'localhost', port: 5432 },
})

// ---------------------------------------------------------------------------
// parseConfig — happy path
// ---------------------------------------------------------------------------
describe('parseConfig', () => {
  it('parses valid configuration', () => {
    const config = parseConfig(validConfig)

    expect(config).toEqual({
      name: 'my-app',
      version: '1.0.0',
      port: 3000,
      database: { host: 'localhost', port: 5432 },
    })
  })
})

// ---------------------------------------------------------------------------
// parseConfig — error paths: invalid JSON
// ---------------------------------------------------------------------------
describe('parseConfig — invalid JSON', () => {
  it('throws ConfigError for invalid JSON', () => {
    expect(() => parseConfig('not json')).toThrow(ConfigError)
  })

  it('includes context in ConfigError', () => {
    expect(() => parseConfig('{')).toThrow(
      expect.objectContaining({
        message: 'Invalid JSON in configuration',
        code: 'CONFIG_ERROR',
        path: 'config.json',
      }),
    )
  })

  it('throws ConfigError for JSON arrays', () => {
    expect(() => parseConfig('[]')).toThrow(ConfigError)
    expect(() => parseConfig('[]')).toThrow('Configuration must be a JSON object')
  })

  it('throws ConfigError for JSON primitives', () => {
    expect(() => parseConfig('"hello"')).toThrow(ConfigError)
    expect(() => parseConfig('42')).toThrow(ConfigError)
    expect(() => parseConfig('null')).toThrow(ConfigError)
  })
})

// ---------------------------------------------------------------------------
// parseConfig — error paths: missing/invalid fields
// ---------------------------------------------------------------------------
describe('parseConfig — validation errors', () => {
  it('throws ValidationError for missing name', () => {
    const raw = JSON.stringify({ version: '1.0.0', port: 3000, database: { host: 'localhost', port: 5432 } })

    expect(() => parseConfig(raw)).toThrow(ValidationError)
    expect(() => parseConfig(raw)).toThrow('Missing required field: name')
  })

  it('throws ValidationError for empty name', () => {
    const raw = JSON.stringify({ name: '  ', version: '1.0.0', port: 3000, database: { host: 'localhost', port: 5432 } })

    expect(() => parseConfig(raw)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining('name'),
        code: 'VALIDATION_ERROR',
        field: 'name',
      }),
    )
  })

  it('throws ValidationError for missing version', () => {
    const raw = JSON.stringify({ name: 'app', port: 3000, database: { host: 'localhost', port: 5432 } })

    expect(() => parseConfig(raw)).toThrow('Missing required field: version')
  })

  it('throws ValidationError for missing port', () => {
    const raw = JSON.stringify({ name: 'app', version: '1.0.0', database: { host: 'localhost', port: 5432 } })

    expect(() => parseConfig(raw)).toThrow('Missing required field: port')
  })

  it('throws ValidationError for port out of range', () => {
    const raw = JSON.stringify({ name: 'app', version: '1.0.0', port: 99999, database: { host: 'localhost', port: 5432 } })

    expect(() => parseConfig(raw)).toThrow(
      expect.objectContaining({
        field: 'port',
        code: 'VALIDATION_ERROR',
      }),
    )
  })

  it('throws ValidationError for non-integer port', () => {
    const raw = JSON.stringify({ name: 'app', version: '1.0.0', port: 3.14, database: { host: 'localhost', port: 5432 } })

    expect(() => parseConfig(raw)).toThrow('Invalid port')
  })

  it('throws ValidationError for missing database', () => {
    const raw = JSON.stringify({ name: 'app', version: '1.0.0', port: 3000 })

    expect(() => parseConfig(raw)).toThrow('Missing required field: database')
  })

  it('throws ValidationError for missing database host', () => {
    const raw = JSON.stringify({ name: 'app', version: '1.0.0', port: 3000, database: { port: 5432 } })

    expect(() => parseConfig(raw)).toThrow('Missing required field: database.host')
  })

  it('throws ValidationError for invalid database port', () => {
    const raw = JSON.stringify({ name: 'app', version: '1.0.0', port: 3000, database: { host: 'localhost', port: -1 } })

    expect(() => parseConfig(raw)).toThrow('Invalid database port')
  })
})

// ---------------------------------------------------------------------------
// Error class properties
// ---------------------------------------------------------------------------
describe('custom error classes', () => {
  it('ValidationError has correct properties', () => {
    const err = new ValidationError('bad input', 'email')

    expect(err).toBeInstanceOf(ValidationError)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('ValidationError')
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.statusCode).toBe(400)
    expect(err.field).toBe('email')
    expect(err.message).toBe('bad input')
  })

  it('NotFoundError formats message with resource and id', () => {
    const err = new NotFoundError('User', 42)

    expect(err.message).toBe('User with id 42 not found')
    expect(err.code).toBe('NOT_FOUND')
    expect(err.statusCode).toBe(404)
  })

  it('ConfigError includes path when provided', () => {
    const err = new ConfigError('broken', '/etc/app.json')

    expect(err.path).toBe('/etc/app.json')
    expect(err.code).toBe('CONFIG_ERROR')
  })
})

// ---------------------------------------------------------------------------
// Async error expectations
// ---------------------------------------------------------------------------
describe('async error handling', () => {
  async function loadRemoteConfig(url: string): Promise<string> {
    if (!url.startsWith('https://')) {
      throw new ValidationError('URL must use HTTPS', 'url')
    }
    return validConfig
  }

  it('rejects with ValidationError for non-HTTPS URL', async () => {
    await expect(loadRemoteConfig('http://example.com'))
      .rejects.toThrow(ValidationError)
  })

  it('rejects with matching properties', async () => {
    await expect(loadRemoteConfig('http://example.com'))
      .rejects.toThrow(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          field: 'url',
          statusCode: 400,
        }),
      )
  })

  it('resolves for valid HTTPS URL', async () => {
    await expect(loadRemoteConfig('https://example.com')).resolves.toBe(validConfig)
  })
})

// ---------------------------------------------------------------------------
// tryParseConfig — result type pattern
// ---------------------------------------------------------------------------
describe('tryParseConfig', () => {
  it('returns ok result for valid config', () => {
    const result = tryParseConfig(validConfig)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.name).toBe('my-app')
    }
  })

  it('returns error result for invalid config', () => {
    const result = tryParseConfig('invalid')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Invalid JSON in configuration')
    }
  })
})
