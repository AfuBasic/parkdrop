# ParkDrop Production Release Checklist

Use this checklist before authorizing any deployment to production.

---

## 1. Code Quality & Static Analysis
- [ ] Working branch is clean and up to date with `main`.
- [ ] No secrets or credentials in diff (`git diff`).
- [ ] Backend tests pass completely: `docker exec parkdrop-backend-1 php artisan test`.
- [ ] Backend code style conforms to standards: `docker exec parkdrop-backend-1 vendor/bin/pint --test`.
- [ ] Frontend unit tests pass completely: `npx vitest run --project unit`.
- [ ] Frontend production build succeeds cleanly: `npm run build`.
- [ ] Storybook production bundle builds cleanly: `npm run build-storybook`.
- [ ] Frontend lint passes without errors: `npm run lint`.

---

## 2. Environment & Configuration
- [ ] `APP_ENV=production` and `APP_DEBUG=false` are verified.
- [ ] Canonical domains are set:
  - Frontend: `https://app.parkdrop.com.ng`
  - API: `https://api.parkdrop.com.ng`
  - Reverb: `wss://ws.parkdrop.com.ng`
- [ ] Database credentials, Redis password, ZeptoMail, Termii, Flutterwave, and Cloudinary keys are configured in server vault.
- [ ] `SESSION_DOMAIN=.parkdrop.com.ng` and `SESSION_SECURE_COOKIE=true` are active.

---

## 3. Deployment Steps
- [ ] Dependencies installed with `--no-dev` and `--optimize-autoloader`.
- [ ] Database migrations executed: `php artisan migrate --force`.
- [ ] Route, config, view, and event caches generated.
- [ ] Horizon worker supervisor terminated and restarted: `php artisan horizon:terminate`.
- [ ] Reverb WebSocket service restarted.
- [ ] Frontend static assets synchronized to web root.

---

## 4. Post-Deployment Verification
- [ ] Liveness probe succeeds: `GET /api/v1/health/live` returns HTTP 200.
- [ ] Readiness probe succeeds: `GET /api/v1/health/ready` returns HTTP 200.
- [ ] Scheduler heartbeat active: verify `scheduler_last_heartbeat_at` in `/health/dependencies`.
- [ ] Run synthetic smoke test runbook (`docs/production/smoke-tests.md`).
- [ ] Monitor error logs for any unexpected 5xx spikes or unhandled exceptions.

---

## 5. V1 Launch Sign-Off (Build 25 — Product Polish)

> Complete this section only when all core builds (1–25) have been verified against the criteria below.

### Package Lifecycle Completeness
- [x] Package can be recorded, searched, and viewed on a 360px mobile viewport.
- [x] Package can be collected via `ReleasePackageSheet` with pickup code verification.
- [x] Package can be returned or cancelled with reason and mandatory note where required.
- [x] All lifecycle mutations (`COLLECT_PACKAGE`, `RETURN_PACKAGE`, `CANCEL_PACKAGE`) are idempotent on the backend.

### Help & About Surfaces
- [x] `/more/help` renders offline with all 10 static articles.
- [x] `/more/about` shows version `1.0.0`, build date, active workspace context, and diagnostic reference code.
- [x] Contextual help link on PackagePickupCodeCard links to `/more/help?topic=pickup-codes`.

### Navigation & Role Awareness
- [x] More screen groups items into: Operations, Business, Account, Support & Information.
- [x] Attendant role does not see Reports or Business management sections.
- [x] Owner role sees full navigation tree.

### PWA & Offline
- [x] `manifest.webmanifest` has correct name, icons, theme color `#2563EB`, and `standalone` display.
- [x] `index.html` has `viewport-fit=cover` and matching `theme-color` meta tag.
- [x] Service worker generated with Workbox via `vite-plugin-pwa` in `generateSW` mode.
- [x] Frontend production build succeeds cleanly (2130 modules, no errors).

### Code Quality Gate
- [x] Backend: 95 tests pass, 423 assertions, 0 failures.
- [x] Backend: Pint code style: 197 files PASS.
- [x] Frontend: 112 unit tests pass across 26 test files.
- [x] Frontend: 0 lint errors (15 warnings, all non-blocking).
- [x] Frontend: Production build succeeds, PWA precache generated.

### V1 Sign-Off
- [ ] **Authorized by:** _________________________ **Date:** _____________

