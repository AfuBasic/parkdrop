# ParkDrop Production Deployment & Rollback Guide

This guide describes the standard zero-loss deployment and rollback procedures for ParkDrop in production.

---

## 1. Pre-Deployment Verification Checklist

Before starting any deployment to production:
1. **CI Quality Gate**: All tests on `main` branch must be green (Pest, Pint, Vitest, TypeScript, Vite build, Storybook).
2. **Migration Audit**: Check if migrations include table drops, column renames, or locks. Apply expand-and-contract pattern.
3. **Database Backup**: Confirm automated daily snapshot exists or run manual pre-migration dump.
4. **Configuration Check**: Check if new environment variables were introduced in `.env.example`.

---

## 2. Standard Deployment Procedure

Execute the following sequential deployment sequence:

```bash
# 1. Enter maintenance mode if destructive schema changes are unavoidable (optional)
# php artisan down --render="errors::503" --secret="parkdrop-deploy-bypass"

# 2. Pull latest release code
git checkout main
git pull origin main

# 3. Backend dependency installation
composer install --no-dev --optimize-autoloader

# 4. Clear and cache configuration, routes, and views
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 5. Execute database migrations
php artisan migrate --force

# 6. Restart queue workers (Horizon)
php artisan horizon:terminate

# 7. Restart Reverb WebSocket server
# If managed via supervisor/systemd:
# supervisorctl restart parkdrop-reverb:*
# Or docker compose:
docker compose restart reverb

# 8. Deploy frontend static assets
cd ../frontend
npm ci
npm run build
# Sync dist/ to web server root / CDN with immutable cache on assets and no-cache on index.html

# 9. Exit maintenance mode
# php artisan up

# 10. Post-deployment smoke check
curl -f https://api.parkdrop.com.ng/api/v1/health/live
curl -f https://api.parkdrop.com.ng/api/v1/health/ready
```

---

## 3. Rollback Procedure

When critical defects (such as authentication failure, corrupted sync, or payment credit loops) occur:

### A. Frontend Rollback
Revert web server root to the previous build directory or rollback S3/CDN release pointer:
```bash
# Frontend assets are content-hashed, so previous build assets remain valid immediately.
ln -sfn /var/www/parkdrop-frontend/releases/previous /var/www/parkdrop-frontend/current
```

### B. Backend Rollback
1. Checkout previous stable commit:
   ```bash
   git checkout <PREVIOUS_COMMIT_TAG>
   ```
2. Re-cache config:
   ```bash
   composer install --no-dev --optimize-autoloader
   php artisan config:cache
   php artisan route:cache
   ```
3. Restart workers and Reverb:
   ```bash
   php artisan horizon:terminate
   supervisorctl restart parkdrop-reverb:*
   ```
4. **Database Rollback Caution:**
   - DO NOT run `php artisan migrate:rollback` if new packages or payments were recorded during the deployment window.
   - Prefer deploying a forward-compatible patch fix rather than destructive schema drops.
