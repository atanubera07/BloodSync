# Product refinement check — 2026-10-11

Scope: synthetic-data BloodSync MVP. This is a product and source check, not a clinical, legal, or independent security approval.

| Journey                  | Current result | Evidence and limit                                                                                                                                                                                                                                    |
| ------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signup to account        | Improved       | Members can review and change optional contact, location, and self-reported blood group fields on their account page. Email and name remain read-only; email changes need a verified-change flow before support.                                      |
| Dashboard to next action | Improved       | Member dashboard reads the actual donor profile status and recent request list, then points to the relevant profile, match, or request action. This is guidance, not a complete count of all requests.                                                |
| Admin donor decision     | Improved       | The queue shows age, weight, and donation-gap screening flags and disables approval when they fail. Each decision asks for confirmation. The API still enforces the same screening and ownership rules. Clinical eligibility remains outside the app. |
| Account privacy          | Improved       | Account detail reads and writes are scoped to the authenticated user's ID. Updates use a strict schema, CSRF protection, a shared rate limit, and an audit event. The edit UI explains that self-reported blood group does not change donor approval. |
| Real-world launch        | Open           | Keep synthetic data only until clinical and legal review, independent security review, backup restore practice, and representative load/device testing are complete.                                                                                  |

Verification recorded for this change: typecheck, lint, formatting, API ownership tests, web account and dashboard tests, full test suite, and production build. Deployment status must be checked separately after release.
