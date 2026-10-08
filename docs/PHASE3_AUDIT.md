# Phase 3 security and privacy audit

A fresh read-only code audit was run after the initial Phase 3 implementation. The findings below were fixed in code unless marked unverified. No independent security, legal or clinical review has been performed.

| Severity    | Where                           | Why it matters                                                                             | Smallest safe fix and result                                                                                | Manual verification                                                               |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Important   | Account export                  | Including request interests exposed another donor's identifiers                            | Removed nested interests from owned request export. Own interests remain in a separate owner-filtered list. | Export a request with another donor's interest; inspect JSON for that donor's ID. |
| Important   | Matching and contact disclosure | An old privacy-version consent could still permit sharing                                  | Require the current version in SQL matching and request interest query.                                     | Give a donor only an old-version consent and check matching/contact views.        |
| Important   | CSRF retry                      | Refresh rotated the CSRF cookie while mutation retry reused the old header                 | Rebuild headers on retry; unit test covers rotated value.                                                   | Expire access and save a profile.                                                 |
| Important   | Web/API hosts                   | Host-only CSRF cookie was unreadable from a different web host                             | Added a same-origin `/api` proxy and explicit production HTTPS `API_ORIGIN`.                                | Test actual deployment domains and cookie scope.                                  |
| Important   | Donor profile consent           | Consent could persist when profile validation failed                                       | Donor `PUT` accepts consent and saves it with the profile in one transaction after validation.              | Submit an invalid profile, then inspect consent state.                            |
| Improvement | Matching limit                  | Filtering after SQL `LIMIT 100` could hide eligible donors                                 | Added eligibility criteria before SQL limit; JS screening remains a second check.                           | Seed many ineligible nearby donors plus an eligible farther donor.                |
| Improvement | Metadata                        | Private routes had no explicit noindex                                                     | Added private route layouts and robots rules in Phase 5.                                                    | Inspect rendered metadata and robots policy.                                      |
| Important   | Real-world operations           | Production backups, recovery, monitoring, legal retention and medical review are undefined | Documented as unresolved launch requirements.                                                               | Restore a staging backup, rehearse an incident, obtain reviews.                   |

## Verification

- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` and production builds passed locally after Phase 3 changes.
- The integration script passed with PostGIS, Redis and Mailpit. It checks auth rotation/reuse, CSRF origin and token, lockout, donor approval, ownership, matching, consent, account export and password-confirmed deletion with synthetic accounts.
- Redis limiter unit tests use two middleware instances sharing one counter; `Retry-After` is asserted. This is not a multi-process load test.
- `pnpm audit --audit-level high` reported no known vulnerabilities after upgrading Nodemailer/Vitest and overriding PostCSS/deepmerge-ts.
- Local Gitleaks 8.30.0 scanned 12 commits with no leaks after an exact allowlist for the synthetic smoke-test password; the remote CI result is recorded after push. No independent penetration test was performed.

| Area              | Ready?  | Notes / fixes                                                                                                     |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| Responsive Design | Not yet | Phase 4 browser checks cover selected public pages, not all devices.                                              |
| Security          | Not yet | Local controls pass; production ingress, secrets, independent review and real-data legal basis remain unverified. |
| Performance       | Not yet | No representative load or production Core Web Vitals.                                                             |
| Error States      | Not yet | Selected forms have feedback; slow/offline coverage is incomplete.                                                |
| SEO and Metadata  | Not yet | Phase 5 implementation and a real canonical domain remain.                                                        |
