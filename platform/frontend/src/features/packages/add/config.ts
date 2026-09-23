/**
 * Configuration options for the Add Package flow.
 */

/**
 * Whether customer name is strictly required to save a package.
 * Per brief: Phone number is the identity. Packages without a name show
 * the phone number. Default: false.
 */
export const REQUIRE_CUSTOMER_NAME = false;

/**
 * Maximum customer suggestions shown while typing phone number (< 11 digits).
 */
export const MAX_PHONE_SUGGESTIONS = 3;

/**
 * Seconds for the undo package window on the success screen.
 */
export const UNDO_WINDOW_SECONDS = 10;
