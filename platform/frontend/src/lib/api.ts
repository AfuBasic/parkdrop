export class ApiError extends Error {
  status: number;
  data?: any;
  errors?: Record<string, string[]>;
  requestId?: string | null;

  constructor(status: number, message: string, data?: any, requestId?: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.requestId = requestId;
    
    // Auto-extract Laravel's validation errors bag if it's a 422 Unprocessable Entity
    if (status === 422 && data?.errors) {
      this.errors = data.errors;
    }
  }
}

function getXsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${import.meta.env.VITE_API_URL || ''}${endpoint}`;
  
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const xsrfToken = getXsrfToken();
  if (xsrfToken && !headers.has('X-XSRF-TOKEN')) {
    headers.set('X-XSRF-TOKEN', xsrfToken);
  }

  // We rely on Sanctum's withCredentials for auth
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Vite proxy / same-origin will use cookies if configured properly
  };

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Failed to fetch' || err.message.includes('NetworkError'))) {
      throw new Error('Could not connect. Check your internet and try again.');
    }
    throw err;
  }

  if (!response.ok) {
    let message = 'An unexpected error occurred. Please try again.';
    let data;
    try {
      data = await response.json();
      // Only use server message if it is not a 500 internal server error or stack trace
      if (response.status >= 500) {
        message = 'Something went wrong on our end. Please try again shortly.';
      } else if (response.status === 401) {
        // Laravel's default body here is the single word "Unauthenticated.",
        // which is accurate but not something to show a person mid-shift.
        message = 'Your session ended. Sign in again to continue.';
      } else if (data.message && typeof data.message === 'string') {
        // Guard against any accidental raw exception messages leaking in non-500s
        const raw = data.message.toLowerCase();
        if (
          raw.includes('sqlstate') ||
          raw.includes('stack trace') ||
          raw.includes('exception in') ||
          raw.includes('syntax error') ||
          raw.includes('call to a member function')
        ) {
          message = 'Something went wrong. Please try again.';
        } else {
          message = data.message;
        }
      }
    } catch {
      // Non-JSON response
      if (response.status >= 500) {
        message = 'Something went wrong on our end. Please try again shortly.';
      }
    }

    const requestId = response.headers.get('X-Request-ID');
    throw new ApiError(response.status, message, data, requestId);
  }

  return response;
}
