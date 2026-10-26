# Product review: 2026-10-26

Scope: the BloodSync synthetic-data MVP, including account journeys, donor review and consent, request matching, responsive UI, security controls, and release operations. This review does not approve real donor or patient data.

## Baseline evidence

The Vercel production deployment `dpl_235i6tShRVS8AYSK5swkXThgyeh4` reports `READY` for commit `9f61a34` from `feat/vercel-adaptation`. This establishes deployment state, not complete workflow correctness.

GitHub CI run [38839622394](https://github.com/atanubera07/BloodSync/actions/runs/38839622394) for that commit failed. The `lint-format`, `unit` (including API coverage), `build`, `docker-build`, `security`, and `codeql` jobs passed. The API integration script passed; the browser portion of the `integration` job failed.

The browser failure is specific: `scripts/browser-auth-check.mjs` used a partial `Password` label lookup that matched both the sign-in input and its new `Show password` control. Public routes at 320px and 1440px and the home page at 200% CSS zoom passed in that run. The authenticated journey stopped before sign-in and must be repeated.

## Fixes in this review

| Area                        | Change                                                                                                                | Verification status                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Authenticated browser smoke | Match the password label exactly so the visibility button cannot be selected as an input.                             | Pending CI for the refinement commit.                                |
| CI startup checks           | Fail explicitly if API or web readiness never succeeds during the retry window.                                       | Pending CI for the refinement commit.                                |
| Deployment documentation    | Record the deployed baseline, release branch, public health routes, and requirement to check CI for the deployed SHA. | Source checked against Vercel metadata and API prefix configuration. |
| Operations and support      | Document Vercel checks and rollback considerations; include the production branch in the security support policy.     | Documentation review only; no rollback or incident drill performed.  |

## Completion criteria

Before releasing the refinement, require all seven CI jobs to pass on its commit. Repeat affected synthetic browser journeys and check production liveness, readiness, and authorization denials after deployment. Record the actual commit and results here when verification completes.

The execution workspace was unavailable during the initial source review. No local tests, browser sessions, migration commands, or production account mutations were performed as part of that initial review.

## Remaining limits

Independent security and clinical review, representative device and load testing, email and job retry observation, backup restore practice, incident ownership, and a legal retention policy remain open. A successful synthetic-data check does not resolve these requirements for real-data use.
