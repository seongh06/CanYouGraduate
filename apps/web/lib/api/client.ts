import type { ApiResponse } from '@canyougraduate/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export class EverytimeRateLimitedError extends ApiError {}

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  sessionId?: string | null;
  body?: unknown;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.sessionId ? { 'X-Session-Id': options.sessionId } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) {
    if (res.status === 429) {
      throw new EverytimeRateLimitedError(json.message, res.status);
    }
    throw new ApiError(json.message, res.status);
  }

  return json.data;
}
