const defaultApiBaseUrl = 'http://localhost:3001';

const defaultDevHeaders = {
  'x-dev-user-email': 'office@example.de',
  'x-dev-user-name': 'Buero Test',
  'x-company-slug': 'luetjens',
  'x-company-name': 'Luetjens Service',
  'x-membership-role': 'OFFICE',
};

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl;
}

export function getDevelopmentAuthHeaders() {
  return {
    'x-dev-user-email':
      process.env.DEV_AUTH_USER_EMAIL ?? defaultDevHeaders['x-dev-user-email'],
    'x-dev-user-name':
      process.env.DEV_AUTH_USER_NAME ?? defaultDevHeaders['x-dev-user-name'],
    'x-company-slug':
      process.env.DEV_AUTH_COMPANY_SLUG ?? defaultDevHeaders['x-company-slug'],
    'x-company-name':
      process.env.DEV_AUTH_COMPANY_NAME ?? defaultDevHeaders['x-company-name'],
    'x-membership-role':
      process.env.DEV_AUTH_MEMBERSHIP_ROLE ?? defaultDevHeaders['x-membership-role'],
  };
}

function buildRequestHeaders(options?: {
  includeDevAuth?: boolean;
  authToken?: string;
}) {
  const headers: Record<string, string> = options?.includeDevAuth
    ? getDevelopmentAuthHeaders()
    : {};

  if (options?.authToken) {
    headers.authorization = `Bearer ${options.authToken}`;
  }

  return headers;
}

function parseApiError<T>(status: number, data: T | undefined) {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    return String((data as { message?: string }).message);
  }

  return `Request failed with status ${status}`;
}

async function toApiResult<T>(response: Response): Promise<ApiResult<T>> {
  const rawText = await response.text();
  const data = rawText ? (JSON.parse(rawText) as T) : undefined;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data,
      error: parseApiError(response.status, data),
    };
  }

  return {
    ok: true,
    status: response.status,
    data,
  };
}

export async function fetchApiJson<T>(
  path: string,
  options?: {
    includeDevAuth?: boolean;
    authToken?: string;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    json?: unknown;
  },
): Promise<ApiResult<T>> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = buildRequestHeaders(options);

  if (options?.json) {
    headers['content-type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      method: options?.method ?? 'GET',
      headers,
      body: options?.json ? JSON.stringify(options.json) : undefined,
      cache: 'no-store',
    });

    return toApiResult<T>(response);
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown API error',
    };
  }
}

export async function fetchApiFormData<T>(
  path: string,
  options: {
    includeDevAuth?: boolean;
    authToken?: string;
    method?: 'POST' | 'PATCH';
    formData: FormData;
  },
): Promise<ApiResult<T>> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = buildRequestHeaders(options);

  try {
    const response = await fetch(url, {
      method: options.method ?? 'POST',
      headers,
      body: options.formData,
      cache: 'no-store',
    });

    return toApiResult<T>(response);
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown API error',
    };
  }
}
