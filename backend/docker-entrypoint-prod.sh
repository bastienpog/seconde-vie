#!/usr/bin/env sh
set -eu

echo "Waiting for database..."
until php bin/console dbal:run-sql "SELECT 1" --quiet >/dev/null 2>&1; do
  sleep 2
done

echo "Generating JWT keys if needed..."
php bin/console lexik:jwt:generate-keypair --skip-if-exists --no-interaction

echo "Running database migrations..."
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration

echo "Clearing Symfony cache..."
php bin/console cache:clear --env="${APP_ENV:-prod}" --no-debug

php-fpm -D

exec nginx -g "daemon off;"
