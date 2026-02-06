#!/bin/sh
set -e

# Run migrations
echo "Running migrations..."
pnpm --filter @halaqat/api migration:run:prod

# Start the application
echo "Starting application..."
exec "$@"
