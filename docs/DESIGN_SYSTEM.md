# BloodSync design system

BloodSync serves patients who need clear next steps and donors who need to assess a request quickly. Deep navy conveys reliability, warm neutrals keep clinical tasks calm, and red identifies donation actions and urgent information. Red is used sparingly and never carries status alone: text and icons explain the state. The palette works across the product's varied cultural contexts without relying on culturally specific colour meanings.

## PNS colour roles

The canonical CSS variables live in `apps/web/app/style.css`. Each family has a 50–900 tint scale; 50 is lightest and 900 is darkest.

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

Primary 900 anchors headings and dark panels. Neutral 50 and white form page surfaces; neutral 600 and darker serve text. Supporting 600 is the brand action colour, while supporting 700 is used for text on light surfaces. Success is a separate semantic family for positive feedback. Use explicit labels with errors, success notices, and pending states.

## Layout and typography

The public hero, section introductions, call to action, and desktop authentication layout use a two thirds / one third split. The application workspace allocates one quarter to navigation and three quarters to task content. At narrow widths these become a single column in reading order. IBM Plex Sans is self hosted, with a clear type hierarchy, visible focus outlines, and reduced motion support.

Keep content aligned to the main 1280 px grid, use whitespace before adding borders, and make primary actions easy to locate. On forms, preserve visible field labels, validation text, and toast messages instead of communicating through colour alone.
