#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-aplot-pterodactyl}"
VERSION="${1:-$(git describe --tags --always --dirty)}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build/release"
WORK_DIR="$BUILD_DIR/$APP_NAME"
ARCHIVE="$BUILD_DIR/$APP_NAME-$VERSION.tar.gz"

cd "$ROOT_DIR"

if [[ -n "$(git status --porcelain)" ]]; then
    echo "Refusing to build a release from a dirty working tree."
    echo "Commit or stash your changes first so git archive HEAD includes the exact code you tested."
    git status --short
    exit 1
fi

rm -rf "$BUILD_DIR"
mkdir -p "$WORK_DIR"

git archive --format=tar HEAD | tar -x -C "$WORK_DIR"

export COMPOSER_ALLOW_SUPERUSER=1
composer install \
    --working-dir="$WORK_DIR" \
    --no-dev \
    --optimize-autoloader \
    --no-interaction

yarn --cwd "$WORK_DIR" install --frozen-lockfile
yarn --cwd "$WORK_DIR" run tsc
mkdir -p "$WORK_DIR/public/assets"
yarn --cwd "$WORK_DIR" build:production

rm -rf "$WORK_DIR/node_modules"
rm -rf "$WORK_DIR/storage/logs"/*
rm -rf "$WORK_DIR/storage/framework/cache"/*
rm -rf "$WORK_DIR/storage/framework/sessions"/*
rm -rf "$WORK_DIR/storage/framework/views"/*
rm -f "$WORK_DIR/bootstrap/cache"/*.php
rm -f "$WORK_DIR/.env"

mkdir -p \
    "$WORK_DIR/storage/logs" \
    "$WORK_DIR/storage/framework/cache" \
    "$WORK_DIR/storage/framework/sessions" \
    "$WORK_DIR/storage/framework/views" \
    "$WORK_DIR/bootstrap/cache"

cat > "$WORK_DIR/RELEASE_INSTALL.md" <<'EOF'
# Aplot Pterodactyl Release Install

This package already includes Composer dependencies and compiled frontend assets.
You do not need Node, Yarn, or Composer on the target machine for the frontend build.

Basic install:

```bash
tar -xzf aplot-pterodactyl-*.tar.gz
mv aplot-pterodactyl /var/www/pterodactyl
cd /var/www/pterodactyl

cp .env.example .env
nano .env

php artisan key:generate --force
php artisan migrate --seed --force
php artisan optimize:clear
php artisan config:cache

chown -R www-data:www-data storage bootstrap/cache public/assets
```

If you are migrating an existing panel, copy the old `.env` values instead of generating
a new `APP_KEY`.
EOF

tar -C "$BUILD_DIR" -czf "$ARCHIVE" "$APP_NAME"

echo "$ARCHIVE"
