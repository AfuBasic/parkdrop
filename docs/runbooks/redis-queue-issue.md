# Operational Runbook: Redis & Queue Backlog Issues

## 1. Symptoms
- `/api/v1/health/ready` returns `503 Service Unavailable` with `redis: "Redis service unavailable"`.
- Jobs accumulating in Redis queue without workers processing them.
- High queue wait times detected in Horizon dashboard.

## 2. User Impact
- OTP verification emails or arrival SMS notifications are delayed.
- Core package intake and collection operations remain fully functional (canonical database transactions commit synchronously).
- Reverb real-time broadcasts may be paused until Redis recovers.

## 3. Immediate Safe Actions
1. Check Redis process status:
   ```bash
   docker compose ps redis
   redis-cli ping
   ```
2. Verify Redis memory usage:
   ```bash
   redis-cli info memory
   ```
3. Check Horizon master supervisor:
   ```bash
   php artisan horizon:status
   ```
4. If Horizon workers stopped, restart master supervisor:
   ```bash
   php artisan horizon:terminate
   # Or restart container
   docker compose restart horizon
   ```

## 4. What NOT To Do
- **DO NOT** run `redis-cli flushall` indiscriminately if Redis is used for sessions or queued job persistence.
- **DO NOT** delete failed jobs from `failed_jobs` table without reviewing exception causes.

## 5. Verification
1. Verify Redis ping:
   ```bash
   redis-cli ping
   # Returns PONG
   ```
2. Check queue workers:
   ```bash
   php artisan horizon:status
   # Returns "Horizon is running"
   ```
3. Inspect readiness probe:
   ```bash
   curl -i https://api.parkdrop.com.ng/api/v1/health/ready
   # Returns 200 OK
   ```
