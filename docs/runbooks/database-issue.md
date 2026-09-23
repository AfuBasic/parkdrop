# Operational Runbook: Database & Connectivity Issues

## 1. Symptoms
- `/api/v1/health/ready` returns `503 Service Unavailable` with `database: "Database connection unavailable"`.
- User requests fail with normalized 500 error: `"Something went wrong on our end. Please try again shortly."`.
- Frontend displays offline or connectivity banners.

## 2. User Impact
- Attendants already logged in can continue creating and viewing packages locally in offline mode.
- Changes remain safely queued in Dexie `mutations` store.
- New user authentication and remote sync are paused.

## 3. Immediate Safe Actions
1. Check MySQL container / service status:
   ```bash
   docker compose ps mysql
   # Or systemd:
   systemctl status mysql
   ```
2. Verify disk space on database host:
   ```bash
   df -h
   ```
3. Check MySQL error log:
   ```bash
   tail -n 100 /var/log/mysql/error.log
   ```
4. Restart MySQL service if safely stopped:
   ```bash
   docker compose restart mysql
   ```

## 4. What NOT To Do
- **DO NOT** run `php artisan migrate:fresh` or drop the database.
- **DO NOT** tell users to clear browser site data or IndexedDB on their phones. Local changes exist only on their devices until database connectivity is restored.
- **DO NOT** manually modify MySQL tables directly without audit trails.

## 5. Verification
Run the readiness probe:
```bash
curl -i https://api.parkdrop.com.ng/api/v1/health/ready
# Must return HTTP 200 with {"status":"ready"}
```
Once healthy, mobile devices will resume background sync automatically.
