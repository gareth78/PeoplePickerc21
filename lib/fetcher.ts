import { ApiResponse } from './types';

export async function typedFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const startTime = Date.now();

  try {
    const response = await fetch(url, options);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP error: ${response.status}`,
        meta: { latency },
      };
    }

    const data = await response.json();

    return {
      ok: true,
      data,
      meta: { latency, timestamp: new Date().toISOString() },
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: { latency },
    };
  }
}
