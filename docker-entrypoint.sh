#!/bin/bash
set -e

# Use Render's PORT env variable, default to 10000
PORT="${PORT:-10000}"

# Update Apache to listen on the correct port
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/:80/:${PORT}/" /etc/apache2/sites-available/000-default.conf

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force 2>/dev/null || true
fi

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    php artisan migrate --force 2>/dev/null || true
fi

# Cache config for production
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

echo "Starting Apache on port ${PORT}..."
exec apache2-foreground
