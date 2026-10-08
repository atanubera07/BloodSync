# Phase 2.5 audit

A fresh read-only code review followed the six cleanup commits. Lint, format, typecheck, unit tests and the PostGIS/Redis/Mailpit integration script passed locally. Browser and production checks were not part of this audit.

| Severity    | Where                          | Why it matters                                                                                                 | Smallest safe fix and result                                                                   | Manual verification                                                             |
| ----------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Important   | Auth limiter                   | Per-process buckets could be bypassed across replicas or group all users behind a proxy                        | Replaced by Redis buckets in Phase 3. Trust proxy configuration still needs deployment review. | Send attempts from separate clients through the actual ingress across replicas. |
| Important   | Refresh rotation               | A failed session insert could revoke the old session                                                           | Moved revoke and insert into one database transaction.                                         | Force insert failure and confirm old refresh remains valid.                     |
| Important   | Protected web pages            | Redirect logic depended on the text of a 401 response                                                          | Added typed API status handling.                                                               | Expire both cookies and reload a protected page.                                |
| Important   | Password reset forms           | A network error or 429 could be shown as success                                                               | Added response checks, pending and retry feedback.                                             | Test browser offline and forced 429/500.                                        |
| Improvement | Public metadata and mobile nav | Generic metadata and cramped links reduced usability                                                           | Addressed during Phases 4 and 5.                                                               | Inspect devices and rendered page metadata.                                     |
| Important   | Production operations          | Backups, recovery, monitoring, legal retention and clinical/security reviews have no verified production setup | Remains a launch blocker; documented in the runbook and audits.                                | Rehearse restores and incident response in staging before real use.             |

The auditor initially suspected a missing geospatial index, then corrected that finding after locating the GiST expression indexes in migration `0002_security_mvp`.

| Area              | Ready?  | Notes / fixes                                 |
| ----------------- | ------- | --------------------------------------------- |
| Responsive Design | Not yet | Browser/device checks followed in Phase 4.    |
| Security          | Not yet | Phase 3 work and independent review followed. |
| Performance       | Not yet | No representative load measurement.           |
| Error States      | Not yet | Reset form fixes need browser verification.   |
| SEO and Metadata  | Not yet | Phase 5 work followed.                        |
