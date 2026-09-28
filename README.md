# Excursii Egipt — English-first Next.js CMS starter

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma and MySQL.

## Website modules included
- English-first premium travel homepage, tour listing/detail pages
- About Us, Contact Us, photo gallery, special offers and price list pages
- Booking and contact enquiry form endpoints
- Prisma/MySQL models for tours, bookings, enquiries, admin users, site settings, translations, pages, special offers, gallery and price list
- Search-engine metadata, robots.txt and sitemap
- Initial admin dashboard shell and translation proxy
- Supplied brand logo

## Requirements and local setup
Node.js 20.9+ and MySQL 8+.
1. `npm install`
2. Copy `.env.example` to `.env`
3. Configure `DATABASE_URL` as `mysql://USER:PASSWORD@HOST:3306/DATABASE`
4. `npx prisma generate`
5. `npx prisma migrate dev --name init`
6. `npm run dev`

## Translation
The `/api/translate` route expects a LibreTranslate-compatible API. For free/open-source usage, self-host LibreTranslate and set `TRANSLATION_API_URL` to its private/internal URL (e.g. `http://localhost:5000` when co-hosted). Do not expose an unauthenticated translation server publicly; restrict network access and configure API keys/rate limits. LibreTranslate itself is AGPL-3.0; review license and hosting requirements before commercial deployment. Machine translations should be reviewed before publication.

## Production readiness — required before launch
This repository is an implementation starter and should not be treated as production-hardened or a fully completed CMS until the following are finished and verified:
- Secure admin authentication, session handling, password reset, MFA option, CSRF, rate limits and server-side authorization for every admin action.
- Full admin CRUD UI for all CMS models and audit logging. Never expose admin routes before auth is active.
- Configure email delivery, booking notifications, anti-spam and privacy/consent workflows.
- Verify actual tour offerings, prices, business details, terms, refund/cancellation policy and licensed media.
- Configure database backups, monitoring, error tracking and restore tests.
- Test accessibility, performance, SEO, security, mobile devices, migration and Hostinger's specific Node.js deployment environment.

## Hostinger
Use the Node.js application feature supported by your hosting plan. Configure `npm run build` and `npm run start`, set production environment variables in hPanel, and create a MySQL database/user in hPanel. Confirm your plan's Node runtime and persistent app support before going live.


## Route and endpoint map
- `/` homepage; `/excursii` listing; `/trips/1`, `/trips/2`, `/trips/3` departure-region listings; `/excursii/[slug]` tour detail and booking request form.
- `/special-offers`, `/prices`, `/about`, `/contact`, `/gallery`, `/privacy`, `/cookie-policy`.
- Public endpoints: `GET /api/health`, `GET /api/trip-categories`, `GET/POST /api/translate`, `POST /api/enquiries`, `POST /api/bookings`.
- Admin endpoints: `POST /api/admin/login`, `POST /api/admin/logout`, and authenticated CRUD endpoints under `/api/admin/[resource]` for tours, pages, offers, gallery, price list, site settings, departure regions, booking statuses and enquiry statuses. Booking/enquiry records are not deletable through the generic API.

## Database initialization
For a first-time setup without committed migration history, configure `DATABASE_URL` and run `npx prisma db push` followed by `npx prisma generate`. For a migration-based production workflow, create and review migrations in development with `npx prisma migrate dev`, commit the `prisma/migrations` directory, then run `npx prisma migrate deploy` in production. Do not run `migrate dev` against the live Hostinger database. Run `npm run seed` after setting a unique `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` (12+ characters); rotate the credentials and secret before public launch.

## Translation and languages
The language picker queries the configured LibreTranslate-compatible service for its supported language list and falls back to a curated list if unavailable. Page text translation requires the service's language models to support English-to-target translation. The browser sets document language and RTL direction for Arabic, Hebrew and other RTL locales. Translation is machine-generated and may require manual review; this client-side translation mechanism is a usability feature, not a substitute for reviewed SEO-localized pages.

## Production/legal caveats
The privacy and cookie pages are editable source templates, not legal advice. Before launch, the operator must insert verified legal entity/controller details, contact email, actual vendors, retention schedule, and cookie/analytics inventory. Confirm consent behavior against the actual tracking scripts used. A public WhatsApp contact link is configured as requested.


## Legacy backup migration and media uploads

The supplied legacy SQL dump is a MariaDB/MySQL export. Keep an untouched copy and import it into a separate temporary database first; do not import the old Laravel tables over the new Prisma schema because table names and columns differ. Legacy image references such as `gallery/...` point to files that are not included in a SQL dump; copy the original Laravel `storage`/`public` media directory to recover those assets. Review/map legacy trips, offers, posts, sliders, intro cards, gallery, contacts and settings before running a production import.

Admin image uploads use `POST /api/admin/upload`, require an authenticated admin session, accept JPG/PNG/WEBP/GIF/AVIF up to 8 MB, and store under `public/uploads`. On Hostinger, ensure this directory is writable and persistent across deployments.

### Self-host LibreTranslate

Copy `.env.example` to `.env`, start `docker compose -f docker-compose.libretranslate.yml up -d`, and wait for language models to finish downloading. For API-key mode, create a key in the running container using the command supported by the current LibreTranslate image, e.g. `docker compose -f docker-compose.libretranslate.yml exec libretranslate lt-manage addapikey --key 'YOUR_RANDOM_SECRET' --daily-limit 10000` (confirm CLI flags against the installed image with `lt-manage --help`). Set `TRANSLATION_API_KEY` in the Next.js environment to that exact generated key. Keep the API key server-side; never expose it as a `NEXT_PUBLIC_` variable. Set `TRANSLATION_API_URL` to the reachable LibreTranslate base URL. Docker service names only resolve inside the same Docker network; for a separate Hostinger app process, use the service's reachable private/public endpoint.

LibreTranslate API keys are generated by the running LibreTranslate instance, not by the website code. This repository does not include a generated secret or assert the translation service is already deployed.
