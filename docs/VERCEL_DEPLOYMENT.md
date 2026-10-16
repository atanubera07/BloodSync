# Vercel deployment for synthetic data

The `bloodsync` Vercel project exists in the `atanus-projects` team. The repository has not been connected to it or deployed. Only synthetic accounts and requests are authorized. The application is a prototype and must not process real donor or patient information.

## Project setup

1. Connect `atanubera07/BloodSync` to the existing `bloodsync` project with the repository root as the project root. The root `vercel.json` configures `web` and `api` Services. Services and Queues are beta features; verify that they are enabled in this team before deploying.
2. Attach a Neon PostgreSQL database to the project. Enable PostGIS with `CREATE EXTENSION IF NOT EXISTS postgis;` if Neon has not already done so. Keep Neon's pooled `DATABASE_URL` for the running app and `DATABASE_URL_UNPOOLED` for migrations. The production API build uses the latter when present. Use a fresh database for this prototype.
3. Attach an Upstash Redis database. Set `REDIS_URL` to its **Redis TCP TLS** URL (`rediss://...`). The REST URL and REST token alone do not work with the current rate limiter.
4. Configure a verified SMTP sender. For Resend SMTP, use `smtp.resend.com`, port `465`, user `resend`, an API key with sending access as the password, and a `MAIL_FROM` address on a verified sender domain. Complete domain verification in the provider dashboard.
5. Add the variables below in Vercel project settings for Production. Set `WEB_ORIGIN` and `SITE_URL` to the same final HTTPS site origin, with no trailing slash. Generate each secret independently with at least 32 random characters. Vercel creates `VERCEL` and `VERCEL_PROJECT_PRODUCTION_URL` itself.

| Variable                | Source or value                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Neon pooled PostgreSQL URL for the running app                                            |
| `DATABASE_URL_UNPOOLED` | Neon direct PostgreSQL URL for migrations; PostGIS enabled                                |
| `REDIS_URL`             | Upstash Redis TCP TLS URL                                                                 |
| `WEB_ORIGIN`            | Final HTTPS BloodSync web origin                                                          |
| `SITE_URL`              | Same final HTTPS origin for canonical metadata                                            |
| `SESSION_SECRET`        | Independent random secret, at least 32 characters                                         |
| `INTERNAL_JOB_SECRET`   | Independent random secret, at least 32 characters, shared by both Services                |
| `CRON_SECRET`           | Independent random secret, at least 32 characters; Vercel Cron sends it as a bearer token |
| `SMTP_HOST`             | SMTP provider host                                                                        |
| `SMTP_PORT`             | SMTP provider port, typically `465`                                                       |
| `SMTP_USER`             | SMTP provider username                                                                    |
| `SMTP_PASS`             | SMTP provider password or API key                                                         |
| `MAIL_FROM`             | Sender on the verified domain, for example `BloodSync <mail@example.com>`                 |
| `TRUST_PROXY_HOPS`      | `0` until the actual ingress/proxy topology is verified; then set the verified count      |

The `web` Service receives an internal API URL through a Vercel service binding. Do not set `BLOODSYNC_API_INTERNAL_URL` manually. `API_ORIGIN` is for the local/standalone Next.js rewrite, not the Vercel deployment.

## Deploy and audit

Deploy the main branch only after the provider resources and variables are in place. The production API build applies the committed Prisma migrations before compiling. If migration fails, correct the database connection/permissions and redeploy; do not mark the deployment ready. The same-origin public `/api/v1/*` path routes to the API Service. The email queue consumer is hidden from public routes, and its internal API call requires `INTERNAL_JOB_SECRET`.

After deployment, run a live audit using synthetic accounts: health/readiness, signup and verification email, sign-in and refresh, donor approval, patient request, matching, admin approval, CSRF and role denials, rate limiting, request expiry, canonical links and mobile layout. Verify the Cron invocation and a queue retry in Vercel logs. Record each result and any failures in a dated audit. A successful synthetic-data audit does not approve use with real health data.
