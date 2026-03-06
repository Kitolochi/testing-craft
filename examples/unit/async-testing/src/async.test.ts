import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fetchData, fetchAll } from './api-client'
import { debounce, sleep, retry } from './debounce'

// ---------------------------------------------------------------------------
// fetchData — async/await patterns
// ---------------------------------------------------------------------------
describe('fetchData', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves with data on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ value: 42 }), { status: 200 }),
    )

    const result = await fetchData<{ value: number }>('https://api.example.com/data')

    expect(result).toEqual({ data: { value: 42 }, status: 200 })
  })

  it('throws on empty URL', async () => {
    await expect(fetchData('')).rejects.toThrow('URL is required')
  })

  it('throws on HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 404, statusText: 'Not Found' }),
    )

    await expect(fetchData('https://api.example.com/missing')).rejects.toThrow(
      'HTTP 404: Not Found',
    )
  })

  it('throws on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchData('https://api.example.com/data')).rejects.toThrow(
      'Failed to fetch',
    )
  })

  it('retries on failure then succeeds', async () => {
    vi.useFakeTimers()

    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      )

    const promise = fetchData('https://api.example.com/data', { retries: 1 })

    // Advance past the retry delay (100ms for first retry)
    await vi.advanceTimersByTimeAsync(200)

    const result = await promise

    expect(result.data).toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// fetchAll — concurrent operations
// ---------------------------------------------------------------------------
describe('fetchAll', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves all URLs in parallel', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), { status: 200 }),
    )

    const results = await fetchAll(['https://a.com', 'https://b.com'])

    expect(results).toHaveLength(2)
    expect(results[0].result?.data).toEqual({ id: 1 })
    expect(results[1].result?.data).toEqual({ id: 1 })
  })

  it('captures individual failures without rejecting', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      )
      .mockRejectedValueOnce(new Error('Network error'))

    const results = await fetchAll(['https://a.com', 'https://b.com'])

    expect(results[0].result).toBeDefined()
    expect(results[0].error).toBeUndefined()
    expect(results[1].error).toBe('Network error')
    expect(results[1].result).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// debounce — fake timers
// ---------------------------------------------------------------------------
describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call the function immediately', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced()

    expect(fn).not.toHaveBeenCalled()
  })

  it('calls the function after the delay', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced()
    await vi.advanceTimersByTimeAsync(300)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('resets timer on subsequent calls', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced()
    await vi.advanceTimersByTimeAsync(200)
    debounced() // reset
    await vi.advanceTimersByTimeAsync(200)

    expect(fn).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(100)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('only calls once for rapid invocations', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced()
    debounced()
    debounced()
    debounced()

    await vi.advanceTimersByTimeAsync(300)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes arguments from the last call', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('first')
    debounced('second')
    debounced('third')

    await vi.advanceTimersByTimeAsync(100)

    expect(fn).toHaveBeenCalledWith('third')
  })
})

// ---------------------------------------------------------------------------
// sleep
// ---------------------------------------------------------------------------
describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves after the specified delay', async () => {
    const resolved = vi.fn()

    sleep(500).then(resolved)

    expect(resolved).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)

    expect(resolved).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// retry — exponential backoff
// ---------------------------------------------------------------------------
describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')

    const result = await retry(fn)

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries and succeeds on later attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValueOnce('ok')

    const promise = retry(fn, 3, 100)

    // Advance past backoff: 100ms * 2^0 = 100ms
    await vi.advanceTimersByTimeAsync(200)

    const result = await promise
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after exhausting all attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent failure'))

    const promise = retry(fn, 2, 50)

    // Advance past all backoff delays
    await vi.advanceTimersByTimeAsync(500)

    await expect(promise).rejects.toThrow('persistent failure')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
