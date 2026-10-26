# Runbook

BloodSync is deployed on Vercel for synthetic data only. Use synthetic accounts and requests when reproducing incidents or checking a release.

## Check the deployed prototype

1. Check the web home page and `/api/v1/health/live` at `https://bloodsync-ivory.vercel.app`. Check `/api/v1/health/ready` separately; readiness requires PostgreSQL and Redis.
2. Confirm the production deployment's Git SHA and inspect GitHub CI for that same commit. A Vercel `READY` deployment can coexist with a failed CI workflow.
3. Inspect redacted API runtime logs, the Vercel Queue consumer, and the daily Cron invocation. Do not copy cookies, tokens, email addresses, or health details into tickets.
4. For failed email delivery, inspect the queued job result and SMTP provider logs. For stale requests, check the expiry Cron at `/api/v1/cron/expire-requests`; keep its bearer secret out of logs.
5. If a release breaks a verified journey, use the existing Vercel project's rollback or redeploy control to restore the last verified deployment. Repeat liveness, readiness, anonymous authorization denials, and the affected journey checks. Check schema compatibility first: rolling back application code does not undo database migrations.
6. For suspected exposure, restrict access, preserve redacted evidence, and use the private reporting route in `SECURITY.md`.

## Reproduce locally

1. Start the test dependencies with `docker compose up -d` and inspect `docker compose ps`.
2. Start the apps, then check API `/health/live` and `/health/ready`. Local API routes use `/v1`; the web app proxies them through `/api/v1`.
3. Check migration state with `pnpm --filter @bloodsync/api exec prisma migrate status` and reproduce with `bash scripts/run-integration.sh` using synthetic accounts.
4. Check BullMQ workers for local account email and request expiry. Vercel uses Queues and Cron instead of persistent workers.

Backup restore practice, incident ownership, monitoring alerts, retention policy, and independent clinical and security reviews remain open before real-data use.
