/**
 * Degradation Copy — ParkDrop
 *
 * Single source of truth for all user-facing messages when a capability is unavailable.
 *
 * Rules:
 * 1. No provider names in user-facing copy (no "Termii", "Cloudinary", "Flutterwave").
 * 2. No HTTP status codes.
 * 3. No technical jargon (no "503", "connection reset", "timeout").
 * 4. Copy must be calm, honest, and give the user a next action where possible.
 * 5. Severity levels: info (expected degradation) | warning (operational impact) | error (data risk).
 *
 * Usage:
 *   import { DEGRADATION_COPY } from '@/resilience/degradation-copy';
 *   <CapabilityUnavailable message={DEGRADATION_COPY.PHOTO_PENDING.message} />
 */

export type DegradationSeverity = 'info' | 'warning' | 'error';

export interface DegradationMessage {
  /** Short user-facing message. No provider names. No technical codes. */
  message: string;
  /** Severity for visual presentation (info → grey, warning → amber, error → red) */
  severity: DegradationSeverity;
  /** Optional action label for a CTA button */
  actionLabel?: string;
}

export const DEGRADATION_COPY = {
  /**
   * Photo attached locally but waiting for cloud upload.
   * Expected in offline/degraded state.
   */
  PHOTO_PENDING: {
    message: 'Package saved. Photo will upload when the connection is stable.',
    severity: 'info',
  } satisfies DegradationMessage,

  /**
   * Photo upload definitively failed after retries.
   */
  PHOTO_UPLOAD_FAILED: {
    message: 'Photo could not be uploaded. The package is still saved. Try again when you have a stable connection.',
    severity: 'warning',
    actionLabel: 'Retry upload',
  } satisfies DegradationMessage,

  /**
   * Arrival SMS was sent and confirmed.
   */
  SMS_SENT: {
    message: 'Customer has been notified by text message.',
    severity: 'info',
  } satisfies DegradationMessage,

  /**
   * Arrival SMS definitively failed after retries.
   */
  SMS_FAILED: {
    message: 'Package saved. The arrival notification could not be sent to the customer right now.',
    severity: 'warning',
  } satisfies DegradationMessage,

  /**
   * SMS outcome is ambiguous — may or may not have been delivered.
   * Never prompt to re-send automatically.
   */
  SMS_NEEDS_RECONCILIATION: {
    message: 'Package saved. The notification status could not be confirmed. Your team has been alerted.',
    severity: 'warning',
  } satisfies DegradationMessage,

  /**
   * SMS service unavailable at the time of intake.
   * Package was saved; SMS will be attempted asynchronously.
   */
  SMS_DEFERRED: {
    message: 'Package saved. Customer notification will be sent shortly.',
    severity: 'info',
  } satisfies DegradationMessage,

  /**
   * Payment provider is down — SMS credit purchases unavailable.
   * Core package operations are NOT affected.
   */
  PAYMENT_PROVIDER_DOWN: {
    message: 'SMS credit purchases are temporarily unavailable. Package operations continue normally.',
    severity: 'warning',
  } satisfies DegradationMessage,

  /**
   * Payment was initiated but verification is still pending.
   * Do not instruct user to pay again.
   */
  PURCHASE_PAYMENT_PENDING: {
    message: 'Payment is still being confirmed. Do not pay again. We will update you when confirmed.',
    severity: 'warning',
    actionLabel: 'Check status',
  } satisfies DegradationMessage,

  /**
   * Payment was initiated but may not have completed — ambiguous provider response.
   */
  PURCHASE_PAYMENT_AMBIGUOUS: {
    message: 'Payment status is being confirmed. Please do not attempt another payment for this purchase.',
    severity: 'error',
    actionLabel: 'Check status',
  } satisfies DegradationMessage,

  /**
   * User is offline — admin operations (staff management, invitations) unavailable.
   */
  ADMIN_OFFLINE: {
    message: 'Connect to the internet to manage your team.',
    severity: 'info',
    actionLabel: 'Refresh',
  } satisfies DegradationMessage,

  /**
   * Historical server data unavailable offline (older reports, full package history).
   * Local records remain available.
   */
  HISTORY_UNAVAILABLE_OFFLINE: {
    message: 'Older records are not available offline. Reconnect to load full history.',
    severity: 'info',
  } satisfies DegradationMessage,

  /**
   * Server returned an error loading historical data (not an offline state).
   */
  HISTORY_LOAD_FAILED: {
    message: 'Could not load older records right now. Today\'s operations are still available.',
    severity: 'warning',
    actionLabel: 'Try again',
  } satisfies DegradationMessage,

  /**
   * Offline auth lease has expired while the device is offline.
   * User must reconnect — cannot continue operating without re-authentication.
   */
  OFFLINE_LEASE_EXPIRED: {
    message: 'Your offline session has expired. Please connect to the internet to continue.',
    severity: 'error',
    actionLabel: 'Reconnect',
  } satisfies DegradationMessage,

  /**
   * Sync is in progress — non-blocking notice.
   */
  SYNC_IN_PROGRESS: {
    message: 'Syncing your changes…',
    severity: 'info',
  } satisfies DegradationMessage,

  /**
   * Sync is backed off due to repeated failures — not giving up, just waiting.
   */
  SYNC_BACKED_OFF: {
    message: 'Having trouble connecting to the server. Your work is saved and will sync when the connection improves.',
    severity: 'warning',
  } satisfies DegradationMessage,

  /**
   * Data shown is from local cache — potentially stale.
   */
  SHOWING_CACHED_DATA: {
    message: 'Showing locally saved data.',
    severity: 'info',
  } satisfies DegradationMessage,
} as const;

export type DegradationKey = keyof typeof DEGRADATION_COPY;
