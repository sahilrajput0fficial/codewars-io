# DESIGN.md — CodeWars Color System

> This file is the single source of truth for color usage across the CodeWars codebase. Any agent (Claude Code, Cursor, Copilot, or human) writing UI code MUST reference this file before introducing a new color value. Do not invent colors. Do not approximate. Use the tokens below exactly.

---

## 0. Design philosophy — read this first

CodeWars is **not a SaaS product**. Do not apply SaaS dashboard conventions:
no gradient buttons, no glassmorphism, no soft pastel cards, no glossy drop
shadows, no colorful empty-state illustrations.

CodeWars is a **competitive ranked platform** with a calm, restrained,
gaming-adjacent visual language — closer to Linear, Vercel, or a Chess.com
match screen than to a typical admin dashboard.

The single most important rule in this entire document:

> **One accent color. Used in roughly 6–8 places per screen, never more.**
> Everywhere else is grayscale. Color is a signal, not a decoration.

If you find yourself reaching for a new color to make something "pop,"
stop — the correct fix is almost always spacing, weight, or size, not color.

---

## 1. Token reference — copy these exactly

All values are defined as CSS variables and must be consumed via
`var(--token-name)` or the equivalent Tailwind class — never as raw hex
in component code.

### 1.1 Dark mode (default theme)

```css
:root,
[data-theme="dark"] {
  /* Surfaces */
  --color-bg:           #09090B;  /* page background */
  --color-surface:      #111113;  /* cards, panels, raised surfaces */
  --color-surface-2:    #18181B;  /* nested surface, one step up from --color-surface */
  --color-border:       #1F1F23;  /* all hairline borders — structural only */

  /* Text */
  --color-text-primary:   #FAFAFA;  /* headings, body, primary labels */
  --color-text-secondary: #71717A;  /* metadata, timestamps, helper text */
  --color-text-tertiary:  #3F3F46;  /* disabled states, placeholders */

  /* Accent — the ONLY brand color */
  --color-accent:        #E04646;
  --color-accent-hover:  #C93A3A;  /* darken ~8% for hover/active button states */
  --color-accent-muted:  #E0464622; /* 13% opacity — for subtle bg tints only, e.g. active tab underline glow */

  /* Status — sparse use only, never as large fills */
  --color-success:       #10B981;  /* Accepted verdict, win indicator */
  --color-warning:       #E0A82E;  /* Medium difficulty word, time-low warning */
  --color-danger:        #E04646;  /* same as accent — Hard difficulty, losses, errors */

  /* Rank tiers — icons/borders ONLY, never large fills */
  --color-tier-bronze:   #8B6543;
  --color-tier-silver:   #9CA3AF;
  --color-tier-gold:     #C9A227;
  --color-tier-diamond:  #5EA8D9;
}
```

### 1.2 Light mode

```css
[data-theme="light"] {
  /* Surfaces */
  --color-bg:           #FFFFFF;
  --color-surface:      #FAFAFA;
  --color-surface-2:    #F1F1F2;
  --color-border:       #E4E4E7;

  /* Text */
  --color-text-primary:   #18181B;
  --color-text-secondary: #71717A;  /* identical to dark mode — equal contrast both ways */
  --color-text-tertiary:  #A1A1AA;

  /* Accent — darkened ~10% from dark-mode value, same hue */
  --color-accent:        #D33D3D;
  --color-accent-hover:  #B83434;
  --color-accent-muted:  #D33D3D1A;

  /* Status */
  --color-success:       #0E9A6B;
  --color-warning:       #C9921E;
  --color-danger:        #D33D3D;

  /* Rank tiers — unchanged, already work on both backgrounds */
  --color-tier-bronze:   #8B6543;
  --color-tier-silver:   #9CA3AF;
  --color-tier-gold:     #C9A227;
  --color-tier-diamond:  #5EA8D9;
}
```

### 1.3 Why the accent value changes between modes — do not "fix" this

`#E04646` on `#09090B` and `#D33D3D` on `#FFFFFF` are **intentionally
different hex values for the same role.** This is not an inconsistency to
patch. Red desaturates differently depending on the luminance of its
surround (simultaneous contrast) — the dark-mode accent looks correct and
calm on near-black, but the identical hex on pure white reads as louder
and slightly pink-shifted. Darkening by ~10% for light mode restores the
same *perceived* intensity. If asked to "make light and dark mode use the
exact same accent hex," push back — the visual result will be inconsistent
even though the value is technically identical.

---

## 2. Tailwind config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg:        'var(--color-bg)',
        surface:   'var(--color-surface)',
        surface2:  'var(--color-surface-2)',
        border:    'var(--color-border)',
        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary':  'var(--color-text-tertiary)',
        accent:        'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-muted': 'var(--color-accent-muted)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger:  'var(--color-danger)',
        tier: {
          bronze:  'var(--color-tier-bronze)',
          silver:  'var(--color-tier-silver)',
          gold:    'var(--color-tier-gold)',
          diamond: 'var(--color-tier-diamond)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Arial', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'Courier New', 'monospace'],
      },
    },
  },
};
```

**Rule for agents:** use `bg-surface`, `text-text-secondary`,
`border-border`, `text-accent`, etc. Never use `bg-[#111113]` or any other
arbitrary-value hex class. If a needed token doesn't exist yet, add it to
this file first, in both theme blocks, before using it in a component.

---

## 3. Where the accent color is allowed to appear

This is the full list. If you are about to use `accent` / `--color-accent`
somewhere not on this list, stop and reconsider — the answer is usually
grayscale + weight/size instead.

| # | Location | Notes |
|---|---|---|
| 1 | `>` glyph in the wordmark/logo | The one permanent brand touchpoint |
| 2 | Primary CTA buttons (`Find Match`, `Submit`, `Play`) | Fill or border, not both at once |
| 3 | Active tab / active nav indicator | Thin underline or left-edge bar, not a background fill |
| 4 | "Your row" marker on leaderboard / problem list | Left-edge bar only — never a background tint |
| 5 | Live match timer when time is critically low (<2 min) | Switches text color from `text-primary` to `accent` only in this state |
| 6 | ELO delta when negative, or "Hard" difficulty word | Functional red, same as `danger` token |
| 7 | Focused/active code editor border | Thin 1–2px top border while actively typing in a live match |
| 8 | Hover/active state on accent-colored elements | Uses `--color-accent-hover`, not a new color |

If a design calls for a *ninth* use of accent red, the fix is almost always
to remove one of the existing eight, not add a ninth.

---

## 4. Status / difficulty word colors — functional, not decorative

These borrow LeetCode's information-density pattern: the word itself is
colored, there is no pill/badge background.

```css
.difficulty-easy   { color: var(--color-success); }
.difficulty-medium { color: var(--color-warning); }
.difficulty-hard   { color: var(--color-danger); }
```

Rules:
- Color applies to the text only. No background fill, no border, no pill shape.
- Never use these three colors anywhere except: difficulty word, win/loss
  indicators (green=win, red=loss), and submission verdicts
  (Accepted=success, Wrong Answer/TLE/Error=danger).
- Do not introduce a fourth "informational blue" or similar — if something
  needs a neutral status color, use `text-secondary`, not a new hue.

---

## 5. Rank tier colors — icon/border only, never a fill

```css
.tier-badge--bronze   { border-color: var(--color-tier-bronze); }
.tier-badge--silver   { border-color: var(--color-tier-silver); }
.tier-badge--gold     { border-color: var(--color-tier-gold); }
.tier-badge--diamond  { border-color: var(--color-tier-diamond); }
```

- Tier colors appear ONLY as: a thin 1–2px border on a small icon/badge,
  or as a tab's active-state underline when filtering leaderboard by tier.
- Never use a tier color as a card background, button fill, or large
  surface area. These four colors plus the accent are the absolute
  ceiling of color variety in the entire app — five hues total, used
  with discipline.

---

## 6. Typography pairing (ties directly to color usage)

| Use case | Font | Token |
|---|---|---|
| UI text — headings, body, nav, labels | Inter | `font-sans` |
| Code editor content | JetBrains Mono | `font-mono` |
| **All numbers** — ELO, timers, ranks, stats, match results | JetBrains Mono | `font-mono` |

Numbers are **always** `font-mono`, even inline in a sentence
(e.g. "ELO 1,247" — the digits are mono, the word "ELO" is sans).
This is intentional: tabular figures prevent layout jitter when a live
number updates (timer ticking, ELO changing after a match), and the
mono/sans split itself is part of how the product reads as competitive
rather than as a generic dashboard.

Load both via `next/font/google` — never via an external `<link>` tag or
CDN import:

```js
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });
```

---

## 7. Shape language — the rounded/angular split

This is not strictly a color rule, but it governs how color-bearing
elements are shaped, so it belongs in this file.

- **Angular, clipped corners** (8–10px diagonal cut, not rounded) on
  anything competitive: match cards, VS layouts, rank badges, the
  Submit/Find Match button.
- **Standard rounded corners** (8px border-radius) on anything calm:
  settings, text inputs, nav, profile forms.
- This contrast is what separates "menu" from "match" — do not round
  every corner uniformly just because it's simpler. The inconsistency
  is deliberate and load-bearing for the product's identity.

---

## 8. Explicit anti-patterns — do not do these

An agent should treat every item below as a hard stop, not a suggestion.

- ❌ Gradient buttons or gradient backgrounds of any kind
- ❌ Glassmorphism / backdrop-blur cards
- ❌ Soft, diffuse drop shadows (`box-shadow: 0 10px 40px rgba(...)`) —
  use 1px borders for separation instead
- ❌ More than one accent hue competing for attention on a single screen
- ❌ Tier colors used as background fills
- ❌ A second "brand blue" or any additional hue introduced ad hoc for
  a single feature — if it's not in Section 1, it doesn't exist yet
- ❌ Pure black (`#000000`) or pure white (`#FFFFFF` text) — always use
  the off-black/off-white tokens (`--color-bg` dark mode text is
  `#FAFAFA`, not `#FFFFFF`; this is intentional for reduced eye strain)
- ❌ Hardcoded hex values anywhere in `.tsx` / `.css` files — always
  reference the CSS variable or Tailwind token

---

## 9. Quick-reference cheat sheet

```
Need a button color?         → accent (max 1–2 per screen)
Need body text?               → text-primary
Need a label/timestamp?       → text-secondary
Need a disabled state?        → text-tertiary
Need a card background?       → surface
Need a border anywhere?       → border (always 1px, always this token)
Need a difficulty word color? → success / warning / danger (text only)
Need a rank tier indicator?   → tier.bronze / silver / gold / diamond (border/icon only)
Need anything else colored?   → it probably shouldn't be — use grayscale + weight/size
```

---

*Last updated as part of the CodeWars MVP design system. Any change to
token values in Section 1 must be reflected in both the dark and light
theme blocks and in the Tailwind config simultaneously — they are not
allowed to drift independently.*