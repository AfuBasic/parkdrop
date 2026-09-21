/**
 * HTTP Error Classification for ParkDrop
 *
 * Maps HTTP responses and network errors to semantic error classes that the
 * sync engine and feature layers can act on without knowing HTTP status codes.
 *
 * Design rules:
 * - RETRYABLE errors are safe to retry with backoff. Mutations stay PENDING.
 * - AUTH_REQUIRED means the session expired. Preserve mutations, prompt re-auth.
 * - FORBIDDEN means the user lost permission. Preserve mutations, surface warning.
 * - CONFLICT means the server resolved a domain race. Mutations are acknowledged.
 * - DOMAIN_REJECTED means the server refused the operation for business reasons.
 *   Do not retry. Mark as NEEDS_ATTENTION.
 * - UNKNOWN is a catch-all. Treat as RETRYABLE to avoid silent data loss.
 *
 * Callers MUST NOT expose HTTP status codes to end users.
 * Use degradation-copy.ts to derive safe user-facing messages.
 */

export type HttpErrorClass =
  | 'RETRYABLE'       // transient: network, 429, 5xx — retry with backoff
  | 'AUTH_REQUIRED'   // 401, 419 — session expired, re-authenticate
  | 'FORBIDDEN'       // 403 — insufficient role or revoked membership
  | 'CONFLICT'        // 409 — domain-level race condition resolved by server
  | 'DOMAIN_REJECTED' // 422 — server refused for business rule reasons
  | 'UNKNOWN';        // unexpected — treat as RETRYABLE

/**
 * Classify an HTTP response or network error into a semantic error class.
 *
 * @param response - the fetch Response, or null if the request never completed
 * @param error    - the thrown error if fetch() itself threw (network error, abort, etc.)
 */
export function classifyHttpError(
  response: Response | null,
  error?: unknown
): HttpErrorClass {
  // If fetch() threw (network offline, DNS failure, CORS abort, explicit AbortError)
  if (response === null) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // Explicit abort — not a network failure, not retryable
      return 'UNKNOWN';
    }
    return 'RETRYABLE';
  }

  const { status } = response;

  // 2xx — should not reach here, but classify defensively
  if (status >= 200 && status < 300) return 'RETRYABLE';

  switch (status) {
    case 401:
    case 419: // Laravel CSRF token mismatch
      return 'AUTH_REQUIRED';

    case 403:
      return 'FORBIDDEN';

    case 409:
      return 'CONFLICT';

    case 422:
      // 422 is Laravel's validation error or domain rule rejection
      return 'DOMAIN_REJECTED';

    case 429:
      // Rate limited — transient, retry with backoff
      return 'RETRYABLE';

    case 500:
    case 502:
    case 503:
    case 504:
      return 'RETRYABLE';

    default:
      // 400 (bad request), 404 (not found), or any other 4xx/5xx
      // Treat as UNKNOWN to avoid silent retry loops on bad data
      return 'UNKNOWN';
  }
}

/**
 * Returns true if the error class indicates the operation can be retried with
 * exponential backoff without risk of data corruption.
 */
export function isRetryable(errorClass: HttpErrorClass): boolean {
  return errorClass === 'RETRYABLE' || errorClass === 'UNKNOWN';
}

/**
 * Returns true if the error class means the current mutations should be preserved
 * and not marked as permanently failed.
 */
export function shouldPreserveMutations(errorClass: HttpErrorClass): boolean {
  return errorClass !== 'DOMAIN_REJECTED';
}
