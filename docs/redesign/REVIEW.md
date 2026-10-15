# BloodSync UI/UX redesign review

Branch: `codex/ui-ux-redesign-2026-10-14` (based on `feat/vercel-adaptation`). Production deployment and production branch were not changed.

## Audit and strategy

The starting interface already had a functioning IBM Plex Sans palette, responsive grids, and explicit clinical disclaimers. The review found four improvements with clear user impact:

| Finding                                                                                    | User impact                                                                                            | Redesign response                                                                                                      |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| The landing page presented a broad story but did not separate requesting from donating.    | People had to interpret which action fitted them.                                                      | Added distinct request and donor paths, with specific process and consent copy.                                        |
| The dashboard led with repeated account role and email cards.                              | The next task was pushed below low-value information.                                                  | Moved current activity first and made task links the main tools.                                                       |
| Forms and review panels used different grouping and visual emphasis.                       | Screening, consent, and request details were harder to scan.                                           | Grouped related inputs; simplified the admin review summary and card structure.                                        |
| The mobile workspace rail forced a wide grid track while its outer container hid overflow. | Request form fields on the right were clipped even though the document itself did not scroll sideways. | Constrained the rail and grid track to available width, then checked internal workspace clipping in the browser audit. |
| The account page rendered two `h1` headings.                                               | Page hierarchy was ambiguous to assistive technology.                                                  | Kept one page heading and made account controls a section heading.                                                     |

The baseline browser pass covered 11 routes at 320, 375, 768, 1024, and 1440px with synthetic API responses. No document-level horizontal overflow or unlabeled form controls were found. The account page had the same extra `h1` at all five widths. Screenshot review exposed the clipped mobile workspace fields, which the document-width check missed.

## Resulting structure

The public route now starts with a clear request action and an alternative donor action, followed by a safety note, two task paths, the matching process, and a final account action. About explains what request owners and donors do and states the medical limits. The header and footer lead to those flows without creating new backend behavior.

The workspace uses a narrow numbered navigation rail and a task-first content area. Donor status uses explicit wording such as **Approved for matching**; it does not imply clinical eligibility. Empty request and matching states offer one useful next action. The admin queue keeps medical review context beside the pending count.

The authentication layout now stacks through 900px, with a compact trust note below the form. Sign-up fields retain full width on phones, and navigation collapses before its links crowd the header. Major type sizes follow a 1:1.618 scale from 16px body text, with responsive limits for narrow screens.

Authentication, API routes, consent handling, matching rules, and role checks were preserved. After sign-in, a user returns only to an allowlisted internal task path. All visual review data is synthetic and is mocked in the browser audit script.

## Visual references

| Screen                | Before                                           | After                                          |
| --------------------- | ------------------------------------------------ | ---------------------------------------------- |
| Landing, desktop      | [Before](screenshots/before-home-1440.jpg)       | [After](screenshots/after-home-1440.jpg)       |
| Landing, mobile       | [Before](screenshots/before-home-375.jpg)        | [After](screenshots/after-home-375.jpg)        |
| Sign-up, mobile       | [Before](screenshots/before-signup-375.jpg)      | [After](screenshots/after-signup-375.jpg)      |
| Sign-in, mobile       | —                                                | [After](screenshots/after-signin-375.jpg)      |
| Dashboard, desktop    | [Before](screenshots/before-dashboard-1440.jpg)  | [After](screenshots/after-dashboard-1440.jpg)  |
| Request form, mobile  | [Before](screenshots/before-request-new-375.jpg) | [After](screenshots/after-request-new-375.jpg) |
| Admin review, desktop | [Before](screenshots/before-admin-1440.jpg)      | [After](screenshots/after-admin-1440.jpg)      |

## Validation and limitations

The browser audit in `scripts/visual-audit.mjs` exercises public and authenticated views with synthetic API fixtures at five viewport widths. It checks one page heading, labelled controls, horizontal overflow, WCAG A/AA issues via axe on representative screens, keyboard menu use, visible form focus, and the protected-route sign-in return path. The screenshots are visual references, not pixel-perfect snapshot assertions.

The production build passed lint, formatting, type checking, and build checks. The shared, web, and API suites passed 78 tests. The browser audit passed all 90 route/viewport combinations and 12 representative axe scans. A separate loading-state measurement on the dashboard recorded a cumulative layout shift of 0.004 at 375px and 0 at 1440px after space was reserved for account and activity loading.

This audit does not validate real donor eligibility, clinical workflows, production authentication, or database behavior. The app remains a synthetic-data prototype. No production deployment was made for this redesign.
