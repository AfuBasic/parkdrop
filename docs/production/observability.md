# ParkDrop Production Observability & Health Probes

ParkDrop implements structured logging, multi-tier health probes, request correlation, queue monitoring, and scheduler heartbeat tracking to ensure operational issues in motor parks are detected and resolved immediately.

---

## 1. Multi-Tier Health Check Probes

ParkDrop separates health into distinct liveness, readiness, and operational dependency probes.

### A. Liveness Probe (`GET /api/v1/health/live`)
- **Purpose:** Verifies that the PHP process and web server are responsive without executing heavy queries.
- **Access:** Public (safe for load balancer health checks).
- **HTTP Status:** `200 OK`
- **Response Format:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-09-21T14:25:00+01:00",
    "version": "1.0.0"
  }
  ```

### B. Readiness Probe (`GET /api/v1/health/ready`)
- **Purpose:** Confirms whether this application node can serve real user traffic by testing essential database and Redis connections.
- **Access:** Public (minimal disclosure, no credentials or hosts).
- **HTTP Status:** `200 OK` (Healthy) or `503 Service Unavailable` (Degraded).
- **Response Format (Healthy):**
  ```json
  {
    "status": "ready",
    "timestamp": "2026-09-21T14:25:00+01:00",
    "version": "1.0.0"
  }
  ```
- **Response Format (Degraded):**
  ```json
  {
    "status": "degraded",
    "timestamp": "2026-09-21T14:25:00+01:00",
    "checks": {
      "database": "Database connection unavailable"
    }
  }
  ```

### C. Dependency & Operational Probe (`GET /api/v1/health/dependencies`)
- **Purpose:** Provides deep operational status on subsystems (MySQL, Redis, Scheduler, Outbox depth).
- **Access:** Authenticated (`auth:sanctum`).
- **Response Format:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-09-21T14:25:00+01:00",
    "database": "healthy",
    "redis": "healthy",
    "scheduler": {
      "status": "active",
      "last_heartbeat_at": "2026-09-21T14:24:00+01:00"
    },
    "outbox": {
      "pending_count": 0
    }
  }
  ```

---

## 2. Request Correlation (`X-Request-ID`)

Every incoming HTTP request is assigned or passed a unique correlation identifier via `AssignRequestId` middleware:
- Header: `X-Request-ID`
- Format: UUID v4 or validated client alphanumeric string.
- Bound to Monolog context: all log lines generated during request execution include `request_id`.
- Propagated to client: frontend `ApiError` captures `requestId` for user support reporting.

---

## 3. Scheduler Heartbeat

To prove that the Laravel cron scheduler is running in production:
- Artisan command: `parkdrop:scheduler-heartbeat`
- Schedule: Every minute (`Schedule::command('parkdrop:scheduler-heartbeat')->everyMinute()`)
- Key stored in Redis: `scheduler_last_heartbeat_at`
- Staleness threshold: If `last_heartbeat_at` is older than 3 minutes, the scheduler is classified as `stale` in `/health/dependencies`.

---

## 4. Structured Logging & PII Redaction Policy

Logs in production are formatted as structured JSON containing operational telemetry:
- Fields: `timestamp`, `level`, `environment`, `request_id`, `user_id`, `business_id`, `route`, `status`, `duration_ms`.
- **Strict PII Redaction:**
  The following sensitive operational values must **NEVER** appear in production logs:
  - Customer phone numbers (`phone`, `phone_normalized`)
  - Pickup codes (`pickup_code`)
  - OTP verification codes (`code`, `otp`)
  - Session cookies and authentication tokens (`cookie`, `authorization`, `remember_token`)
  - Passwords and provider signing secrets (`api_secret`, `secret_hash`, `key`)
