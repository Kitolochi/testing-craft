export interface ApiResponse<T> {
  data: T
  status: number
}

export interface FetchOptions {
  retries?: number
  timeout?: number
}

/**
 * Fetch data from an API endpoint with optional retries.
 */
export async function fetchData<T>(
  url: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { retries = 0, timeout = 5000 } = options

  if (!url) {
    throw new Error('URL is required')
  }

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = (await response.json()) as T
      return { data, status: response.status }
    } catch (error) {
      lastError = error as Error
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)))
      }
    }
  }

  throw lastError!
}

/**
 * Fetch multiple URLs concurrently and return all results.
 * If any request fails, the error is captured in the result.
 */
export async function fetchAll<T>(
  urls: string[],
): Promise<Array<{ url: string; result?: ApiResponse<T>; error?: string }>> {
  const results = await Promise.allSettled(
    urls.map((url) => fetchData<T>(url)),
  )

  return results.map((result, i) => ({
    url: urls[i],
    ...(result.status === 'fulfilled'
      ? { result: result.value }
      : { error: result.reason.message }),
  }))
}
