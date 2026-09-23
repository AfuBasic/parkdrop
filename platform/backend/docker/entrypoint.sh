#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Only the web service sets this (see platform/compose.prod.yaml) — running
# it from every replica/process (horizon, reverb, scheduler too) would race
# migrations against each other. --isolated skips the run instead of
# erroring if another process already holds the lock.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    php artisan migrate --force --isolated
fi

exec "$@"
