/**
 * Which identifier the sign-in flow asks for.
 *
 * The audience lives on phone numbers, so the whole flow is built to support
 * either. The switch is deliberately a single value: when the backend can send
 * an SMS code, flip this to 'phone' and every screen, keyboard, placeholder,
 * trust row, error message and hint follows.
 *
 * Default is 'email' because that is the only channel the backend can actually
 * deliver a code on today (POST /api/v1/auth/code takes an `email` field and
 * sends through the mailer). Defaulting to 'phone' would show the user a
 * screen promising an SMS that never arrives.
 *
 * Override at build time with VITE_AUTH_IDENTIFIER=phone.
 */
export type IdentifierMode = 'phone' | 'email';

function resolveMode(): IdentifierMode {
  const configured = import.meta.env?.VITE_AUTH_IDENTIFIER;
  return configured === 'phone' ? 'phone' : 'email';
}

export const AUTH_IDENTIFIER: IdentifierMode = resolveMode();

/**
 * Extra "still no code?" channels on the code screen. Only ever show a channel
 * that actually works — a dead "Call me with the code" button is worse than no
 * button at all. Both are off until the backend exposes the routes.
 */
export const AUTH_FALLBACK_CHANNELS = {
  whatsapp: false,
  voiceCall: false,
} as const;

/** Seconds before the user may ask for another code. */
export const RESEND_COOLDOWN_SECONDS = 30;

/** Wrong PIN attempts allowed before we fall back to a code instead of locking out. */
export const MAX_PIN_ATTEMPTS = 5;

/** Where "Need help?" actually goes. */
export const SUPPORT = {
  email: 'support@parkdrop.com.ng',
} as const;

/**
 * The marketing site, a separate app on its own domain. The Privacy Notice
 * lives there as a static page, not in this bundle, so the link is always
 * absolute — a same-origin "/privacy.html" would 404 once the two are split
 * across domains.
 *
 * Override at build time with VITE_MARKETING_URL.
 */
export const MARKETING_URL =
  import.meta.env?.VITE_MARKETING_URL || 'https://parkdrop.com.ng';

export const PRIVACY_NOTICE_URL = `${MARKETING_URL}/privacy.html`;
