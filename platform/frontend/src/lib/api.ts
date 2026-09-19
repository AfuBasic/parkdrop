export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${import.meta.env.VITE_API_URL || ''}${endpoint}`;
  
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // We rely on Sanctum's withCredentials for auth
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Vite proxy / same-origin will use cookies if configured properly
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    let message = 'An error occurred';
    let data;
    try {
      data = await response.json();
      message = data.message || message;
    } catch {
      // Not JSON
    }
    throw new ApiError(response.status, message, data);
  }

  return response;
}
