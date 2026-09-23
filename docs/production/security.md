# ParkDrop Production Security Hardening

This document outlines ParkDrop's production security policies, defense-in-depth architecture, and access control measures.

---

## 1. Web Security Headers

Every outgoing response is decorated by `SecurityHeadersMiddleware`:
- `X-Content-Type-Options: nosniff`: Prevents MIME type sniffing.
- `X-Frame-Options: DENY`: Prevents embedding inside `<iframe>` tags (clickjacking defense).
- `Referrer-Policy: strict-origin-when-cross-origin`: Minimizes URL exposure in external referrers.
- `Permissions-Policy: camera=(self), microphone=(), geolocation=()`: Grants camera access strictly for package photo taking, blocking unused sensor hardware.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`: Active in production under HTTPS.

---

## 2. Cross-Origin Resource Sharing (CORS)

- Configured in `config/cors.php`.
- Allowed origins are strictly restricted to canonical production domains (`https://app.parkdrop.com.ng`, `https://parkdrop.com.ng`).
- Wildcard `*` origins are strictly forbidden because `supports_credentials` is enabled for Sanctum cookies.
- Exposed headers: `X-Request-ID`.

---

## 3. Session & Authentication Security

- **Passwordless Authentication:** Zero password storage or bcrypt rainbow table risk. 6-digit OTP codes expire in 10 minutes and lock after 5 incorrect attempts.
- **Sanctum First-Party Cookies:**
  - `HttpOnly`: JavaScript cannot read the session cookie.
  - `Secure`: Cookie only transmitted over TLS.
  - `SameSite: Lax`: Prevents CSRF on state-changing requests.
  - No long-lived bearer tokens stored in browser `localStorage`.
- **Offline Authorization Leases:**
  - 24-hour snapshot stored in Dexie `authorization` table.
  - Any server 401 or explicit logout clears the lease immediately.

---

## 4. Multi-Tenant Scoping & Invariant Defense

- **IDOR Prevention:** All mutation handlers and query controllers enforce that the requested entity belongs to the authenticated user's active `business_id`.
- **Database Unique Constraints:**
  - `(business_id, public_package_id)` unique index prevents ID collision.
  - `(business_id, pickup_code)` unique index prevents duplicate claim codes.
  - `sync_mutation_receipts` table enforces strict idempotency on `mutation_id`.
- **Terminal Lifecycle Row-Locks:** `RETURN_PACKAGE` and `CANCEL_PACKAGE` lock packages with `lockForUpdate()` to prevent concurrent collection or double-return races.

---

## 5. Rate Limiting Matrix

| Endpoint | Bucket Key | Limit | Penalty Window |
|---|---|---|---|
| `POST /api/v1/auth/code` (Global) | `global-otp-send` | 1000 / day | 24 hours |
| `POST /api/v1/auth/code` (IP) | IP | 20 / 15 min | 15 minutes |
| `POST /api/v1/auth/code` (Email Daily) | SHA256(email) | 25 / day | 24 hours |
| `POST /api/v1/auth/code` (Email Short) | SHA256(email) | 3 / 15 min | 15 minutes |
| `POST /api/v1/auth/code/verify` | IP | 30 / 15 min | 15 minutes |
| `POST /api/v1/sync/push` | User / Device | 120 / min | 1 minute |
| `GET /api/v1/reports/daily-operations/export` | User | 10 / min | 1 minute |
| `POST /api/v1/packages/{pkg}/media/authorize` | User | 30 / min | 1 minute |
| `POST /api/v1/sms-credit-purchases` | User | 15 / min | 1 minute |
