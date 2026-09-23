/**
 * Paying with Paystack means a full page navigation away from the app and
 * back — the SPA (and all its in-memory React state) is torn down and
 * rebuilt from scratch on return, so AuthContext's boot sequence treats it
 * exactly like a cold app launch and re-locks behind the PIN screen. That's
 * correct for an actual cold launch, but here it means someone who just
 * finished paying gets a PIN prompt before they can even see whether the
 * payment went through — the PIN gate wasn't protecting anything they
 * hadn't already unlocked seconds earlier, in the same task.
 *
 * This is a narrow, single-use, time-boxed exception: set right before
 * sending the browser to the payment gateway, consumed (and cleared) the
 * moment the return screen boots back up. It only ever skips the lock for
 * that one specific landing — every other route, and any use after the
 * window expires or the marker is consumed, goes through the PIN as normal.
 * The underlying server session (and the purchase-status request itself)
 * is still fully auth-gated regardless of this — it never bypasses that.
 */

const STORAGE_KEY = 'pd_pending_payment_return';
const GRACE_WINDOW_MS = 15 * 60 * 1000; // Generous for slow bank/OTP steps on the provider's side, tight enough to not linger as a standing bypass.
const RETURN_PATHS = ['/sms-credits/purchase/return', '/more/sms-credits/return'];

export function markPendingPaymentReturn(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + GRACE_WINDOW_MS));
  } catch {
    // Best-effort — worst case the PIN prompt reappears on return, which is
    // the pre-existing behavior this is improving on, not a regression.
  }
}

/**
 * Call once, at auth boot. Returns true (and consumes the marker) only if
 * we're landing on the payment-return route within the grace window of a
 * checkout this same device initiated.
 */
export function consumePendingPaymentReturnIfValid(pathname: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    localStorage.removeItem(STORAGE_KEY);

    const expiresAt = Number(raw);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

    return RETURN_PATHS.some((path) => pathname.startsWith(path));
  } catch {
    return false;
  }
}
