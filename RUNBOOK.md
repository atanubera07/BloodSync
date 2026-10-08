# Runbook

BloodSync is not deployed for real-world use. This runbook covers local or test environments.

1. Check `/health` and the web home page, then the CI run for the deployed commit.
2. Check API structured logs for request errors. Never paste tokens, email addresses or health details into tickets.
3. Check PostgreSQL, Redis and Mailpit health with `docker compose ps`; inspect migration state with `pnpm --filter @bloodsync/api exec prisma migrate status`.
4. Reproduce with synthetic accounts and `bash scripts/run-integration.sh`. Check worker processing if requests remain OPEN past expiry.
5. For suspected data exposure, restrict access, preserve redacted logs, and use the private security reporting path in `SECURITY.md`.

Production backups, recovery, monitoring, incident ownership and legal retention must be defined before launch.
