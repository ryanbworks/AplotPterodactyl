# Installable Release

Use the source repository for development. Use GitHub Releases for installation.

To create an installable package locally:

```bash
bash scripts/build-release.sh v1.0.0
```

The generated file will be in:

```txt
build/release/aplot-pterodactyl-v1.0.0.tar.gz
```

That package includes:

- PHP source code.
- `vendor/` from `composer install --no-dev`.
- Compiled frontend files in `public/assets/`.
- `.env.example`.

It does not include:

- `.env`.
- `node_modules/`.
- Logs, sessions, views, or Laravel cache files.

To publish one on GitHub, create and push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The GitHub Action will build the package and attach the `.tar.gz` to the release.
The person installing the panel should download that `.tar.gz`, not the source zip.

Target install:

```bash
cd /var/www
tar -xzf aplot-pterodactyl-v1.0.0.tar.gz
mv aplot-pterodactyl pterodactyl
cd /var/www/pterodactyl

cp .env.example .env
nano .env

php artisan key:generate --force
php artisan migrate --seed --force
php artisan optimize:clear
php artisan config:cache

chown -R www-data:www-data storage bootstrap/cache public/assets
```

When migrating an existing panel, reuse the old `.env` values, especially `APP_KEY`,
database settings, Redis settings, `APP_URL`, and `HASHIDS_SALT`.
