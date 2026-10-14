# BloodSync design system

BloodSync is a synthetic-data healthcare coordination prototype. Its interface should help a request owner, a potential donor, or an administrator find the next task quickly while preserving the distinction between coordination and clinical care.

## Design direction

The visual system is editorial and calm: warm neutral surfaces for reading, navy for structure and trust, and red for BloodSync branding, priority actions, and urgent states. The public site distinguishes the request and donor journeys. Authenticated pages place the current task ahead of account metadata. No colour alone communicates a status, and no design element suggests a guaranteed match or medical approval.

The approximate **60:30:10** balance is white and warm neutral canvas, navy structure and supporting surfaces, then red accents and priority actions. It is a hierarchy guide, not a required pixel ratio on every screen. A separate green scale identifies positive status and success messages.

## Colour scales

The canonical CSS variables are in `apps/web/app/style.css`. 50 is the lightest tint and 950 the darkest.

| Step | Primary   | Neutral   | Supporting | Success   |
| ---- | --------- | --------- | ---------- | --------- |
| 50   | `#f1f2f8` | `#fafaf9` | `#fff3f3`  | `#eef8f0` |
| 100  | `#e1e3f0` | `#f3f3f0` | `#ffe1e2`  | `#d9f0df` |
| 200  | `#c5c8df` | `#e5e5df` | `#ffbdc0`  | `#b4dfc1` |
| 300  | `#a5abd0` | `#d0d0c7` | `#f7898e`  | `#83c99b` |
| 400  | `#818bbc` | `#afaea2` | `#e65b61`  | `#55a977` |
| 500  | `#606da5` | `#858478` | `#d9363d`  | `#358b5c` |
| 600  | `#465186` | `#66665d` | `#d21319`  | `#26734b` |
| 700  | `#333b6b` | `#4d4e48` | `#a81017`  | `#1e5c3d` |
| 800  | `#252b58` | `#363832` | `#860e15`  | `#184a33` |
| 900  | `#1b1e4a` | `#232520` | `#650d13`  | `#123b29` |
| 950  | `#11132f` | `#151712` | `#4d090f`  | `#0b2a1d` |

Semantic aliases include `--color-canvas`, `--color-surface`, `--color-ink`, `--color-ink-subtle`, `--color-border`, `--color-action`, and `--color-focus`. Use supporting 700 for red text on a light surface and supporting 600 with white for primary actions. Use primary 600 for focus indicators on light surfaces. Key checked pairs meet WCAG AA for normal text: supporting 600 on white 5.46:1, supporting 700 on white 7.63:1, neutral 600 on white 5.8:1, primary 600 on white 7.55:1, and white on primary 900 15.78:1.

## Type, space, and shape

IBM Plex Sans is self-hosted under its bundled OFL license for interface text. Boska and Switzer were considered as visual references; this version keeps the existing licensed font asset and uses the system Georgia serif sparingly for expressive public headings. This avoids third-party font requests and unverified redistribution of new font assets. The stack falls back to Arial for interface text and Times New Roman for display text.

Spacing tokens follow an 8-point rhythm, with 4px and 12px available for small adjustments: `--space-1` through `--space-20`. Shared radii are 6px and 12px. Type uses a clear hierarchy of page title, section heading, card heading, body text, helper text, and uppercase eyebrow. Headings use short lines and responsive sizes; body copy retains generous line height.

## Components and behavior

- The landing page has distinct request and donor paths. Its process section states what matching and consent actually do.
- Buttons use a red primary action, neutral secondary action, and visible focus state. Disabled controls remain legible and clearly inactive.
- Forms group related fields, keep visible labels, show required context before submission, and use explicit error or success text. The optional location field explains rounding and city-only matching.
- `EmptyState` gives an actionable next step. `StatusBadge` combines words with semantic colour: green for open requests and matching approval, red for urgent, expired, or needs-update states, and neutral for pending, standard, or closed states.
- The workspace navigation uses numbered destinations with a visible current page. On smaller screens it becomes a horizontal scrollable row in reading order.
- The footer keeps prototype and medical boundaries visible, with separate exploration and information links.
- Motion is brief and optional; reduced-motion preferences disable animation and smooth scrolling.

The main content grid is capped at 1280px. Desktop landing sections use an asymmetric two-column composition; authenticated pages prioritize task content beside a narrow navigation rail. At 760px and below, these sections stack without changing reading order.
