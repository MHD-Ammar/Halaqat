#!/bin/sh
set -e

# Database connection settings (with defaults)
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
MAX_RETRIES="${DB_MAX_RETRIES:-30}"
RETRY_INTERVAL="${DB_RETRY_INTERVAL:-2}"

# Wait for database to be ready
echo "Waiting for database at $DB_HOST:$DB_PORT..."
retries=0
until nc -z "$DB_HOST" "$DB_PORT"; do
  retries=$((retries + 1))
  if [ $retries -ge $MAX_RETRIES ]; then
    echo "Error: Database is not available after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "Database is unavailable - sleeping ($retries/$MAX_RETRIES)"
  sleep $RETRY_INTERVAL
done

echo "Database is up!"

# Run migrations
echo "Running migrations..."
pnpm --filter @halaqat/api migration:run:prod

# Start the application
echo "Starting application..."
exec "$@"
