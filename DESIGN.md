# DESIGN.md — CodeWars Color & Motion System

> This file is the single source of truth for color, typography, and motion
> usage across the CodeWars codebase. Any agent (Claude Code, Cursor,
> Copilot, or human) writing UI code MUST reference this file before
> introducing a new color value, font, or animation. Do not invent colors.
> Do not invent easing curves or durations. Use the tokens below exactly.

---

## 0. Design philosophy — read this first

CodeWars is **not a SaaS product**. Do not apply SaaS dashboard conventions:
no gradient buttons, no glassmorphism, no soft pastel cards, no glossy drop
shadows, no colorful empty-state illustrations.

CodeWars is a **competitive ranked platform** with a calm, restrained,
gaming-adjacent visual language — closer to Linear, Vercel, or a Chess.com
match screen than to a typical admin dashboard.

The single most important color rule in this entire document:

> **One accent color. Used in roughly 6–8 places per screen, never more.**
> Everywhere else is grayscale. Color is a signal, not a decoration.

The equivalent rule for motion:

> **Motion communicates state change, not decoration.** Every animation in
> this product must answer "what just happened?" — a match started, an
> opponent solved a problem, your ELO moved, a timer is running low. If an
> animation doesn't answer that question, it shouldn't exist.

A static, motionless UI for a *live, time-pressured, 1v1 ranked product* is
a design failure — the product is fundamentally about real-time tension,
and the UI must visually carry that tension. But the fix for "feels stale"
is never gratuitous bounce/spring/confetti — it's purposeful, restrained
motion applied to the handful of moments that are actually live.

If you find yourself reaching for a new color *or* a new animation to make
something "pop," stop — the correct fix is almost always spacing, weight,
size, or one of the motion patterns already defined in Section 10, not a
new invention.

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
      transitionTimingFunction: {
        snap:   'cubic-bezier(0.4, 0, 0.2, 1)',   /* default — UI state changes */
        settle: 'cubic-bezier(0.16, 1, 0.3, 1)',  /* entrances, results, reveals */
        sharp:  'cubic-bezier(0.7, 0, 0.84, 0)',  /* exits, dismissals */
      },
      transitionDuration: {
        instant: '100ms',
        fast:    '150ms',
        base:    '220ms',
        slow:    '400ms',
        ambient: '900ms',
      },
      keyframes: {
        'pulse-live':   { /* see Section 10.2 */
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.4 },
        },
        'ring-ping': {  /* see Section 10.2 */
          '0%':   { transform: 'scale(0.9)', opacity: 0.7 },
          '70%':  { transform: 'scale(1.4)', opacity: 0 },
          '100%': { transform: 'scale(1.4)', opacity: 0 },
        },
        'tick-flash': { /* see Section 10.4 */
          '0%':   { color: 'var(--color-text-primary)' },
          '40%':  { color: 'var(--color-accent)' },
          '100%': { color: 'var(--color-text-primary)' },
        },
        'rise-in': {    /* see Section 10.5 */
          '0%':   { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'count-tick': { /* see Section 10.6 */
          '0%':   { transform: 'translateY(-2px)', opacity: 0.4 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      animation: {
        'pulse-live': 'pulse-live 1.8s ease-in-out infinite',
        'ring-ping':  'ring-ping 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'tick-flash': 'tick-flash 600ms ease-out',
        'rise-in':    'rise-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'count-tick': 'count-tick 150ms ease-out',
      },
    },
  },
};
```

**Rule for agents:** use `bg-surface`, `text-text-secondary`,
`border-border`, `text-accent`, etc. for color. Use
`duration-base ease-snap`, `animate-rise-in`, `animate-pulse-live`, etc.
for motion. Never use `bg-[#111113]`, `transition-all duration-[238ms]`,
or any other arbitrary-value class for color or motion. If a needed token
doesn't exist yet, add it to this file first, in the relevant section,
before using it in a component.

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
| 5 | Live match timer when time is critically low (<2 min) | Switches text color from `text-primary` to `accent` only in this state — see Section 10.4 for the accompanying motion |
| 6 | ELO delta when negative, or "Hard" difficulty word | Functional red, same as `danger` token |
| 7 | Focused/active code editor border | Thin 1–2px top border while actively typing in a live match |
| 8 | Hover/active state on accent-colored elements | Uses `--color-accent-hover`, not a new color |

If a design calls for a *ninth* use of accent red, the fix is almost always
to remove one of the existing eight, not add a ninth. The same discipline
applies to motion — see Section 10.0.

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
- When a verdict resolves (Accepted / Wrong Answer / etc. appears after a
  submission), it animates in via `animate-rise-in` (Section 10.5) — it
  never just snaps into existence with no transition. A verdict is a
  moment, and the UI should treat it like one.

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
- A tier-up event (player crosses an ELO threshold post-match) is one of
  the few moments allowed a slightly more pronounced animation — see
  Section 10.7. This is a rare, earned moment, not a template for other
  UI feedback.

---

## 6. Typography pairing (ties directly to color and motion)

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
rather than as a generic dashboard. Tabular figures are also a *motion*
requirement, not just a typographic one — see Section 10.6 for how
numbers should animate when they change.

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
- This same split governs *which elements are allowed to move*. See
  Section 10.0 — angular/competitive elements carry more of the
  product's motion budget than calm/rounded elements do.

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
- ❌ Bounce, spring-overshoot, or elastic easing anywhere (`cubic-bezier`
  curves that overshoot past 1 before settling) — this reads as playful/
  consumer-app, not competitive. Every easing curve in this product
  settles monotonically; see Section 10.1.
- ❌ Confetti, particle bursts, or screen-shake effects on win states —
  the win signal is the ELO number moving and a clean state change, not
  a celebration animation. Restraint is the celebration.
- ❌ Looping decorative animation with no state meaning (e.g. a
  perpetually rotating gradient blob in a hero section) — every loop
  must map to a real "this is live" signal per Section 10.2, or it
  doesn't belong.
- ❌ `transition: all` — always name the specific properties being
  animated (`transition-colors`, `transition-transform`, or an explicit
  property list). `transition: all` animates layout properties
  unintentionally and is a common source of jank.
- ❌ Animating `width`, `height`, `top`, or `left` directly for anything
  that needs to be smooth — use `transform` (`scale`, `translate`) and
  `opacity` only. These are the two properties the browser can animate
  without triggering layout recalculation.

---

## 9. Quick-reference cheat sheet — color

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

## 10. Motion system

### 10.0 The motion budget — read this before animating anything

Every screen has a small, fixed "motion budget" — a short list of things
that are allowed to move. This mirrors the accent-color discipline in
Section 3 exactly: a handful of meaningful touchpoints, everything else
static.

> **Default assumption: a UI element does not animate.** It earns motion
> only by representing one of the categories in Section 10.2–10.7. If
> you're adding an animation and it doesn't fit one of those categories,
> it's decoration, and decoration is exactly what Section 0 says we don't
> add.

This is what keeps an animated CodeWars from turning into a "gamer RGB"
product. Motion is rare, fast, and meaningful — never ambient, slow, or
ornamental.

### 10.1 Easing and duration tokens

All motion in the product draws from this fixed set. Do not invent a new
duration or easing curve inline in a component.

| Token | Value | Use for |
|---|---|---|
| `ease-snap` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default for most UI transitions — hover states, tab switches, button presses |
| `ease-settle` | `cubic-bezier(0.16, 1, 0.3, 1)` | Things entering the screen — modals, result panels, toasts, the `rise-in` pattern |
| `ease-sharp` | `cubic-bezier(0.7, 0, 0.84, 0)` | Things leaving the screen — dismissals, closing a panel |
| `duration-instant` | `100ms` | Micro-feedback — button press, checkbox toggle |
| `duration-fast` | `150ms` | Hover states, small UI shifts |
| `duration-base` | `220ms` | Default — most transitions live here |
| `duration-slow` | `400ms` | Larger surface changes — modal open, page-level state change |
| `duration-ambient` | `900ms` | Reserved exclusively for the live-pulse pattern (Section 10.2) — never used for anything else |

No animation in this product should run longer than `duration-slow`
(400ms) except the deliberately slow, deliberately subtle live-pulse
indicator. If something feels like it needs to take longer than 400ms to
communicate, the problem is usually that it's trying to do too much in one
animation — split it into a sequence of fast steps instead of one slow one.

Every curve **settles monotonically** — nothing overshoots past its final
value and bounces back. This is a hard rule, restated from Section 8: no
spring physics, no elastic easing, anywhere in this product.

### 10.2 Live-state indicators — the "this is happening right now" pattern

Used for: online player count, live match count, an active queue, a
currently-recording WebSocket connection.

```tsx
// components/shared/LiveDot.tsx
export function LiveDot() {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-ring-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-success animate-pulse-live" />
    </span>
  );
}
```

- A small filled dot at `duration-ambient` pulse (opacity 1 → 0.4 → 1,
  1.8s loop) plus a faint expanding ring (`ring-ping`, 1.6s loop).
- This is the **only** looping/ambient animation permitted anywhere in
  the product. It exists exactly once per "live" concept on a screen —
  not decoratively repeated.
- Color is `success` (or `accent` if the live thing is specifically
  "your active match," to tie it to the accent's role list in Section 3
  — do not introduce a third color for this).

### 10.3 Opponent progress — the "they just did something" pattern

Used for: opponent solved a problem, opponent submitted, opponent joined
the match.

- The relevant indicator (a tracker segment, a checkmark, a progress dot)
  transitions via `duration-base ease-settle` from its empty state to its
  filled state — `opacity` and `scale` only, per Section 8's
  transform/opacity rule.
- On the moment this happens, the element gets a **single** brief flash
  using `accent-muted` as a background-color transition that fades back
  to transparent over `duration-slow` — this is the one place a
  background-color transition (not transform/opacity) is acceptable,
  because it's low-frequency (happens a handful of times per match, not
  continuously) and communicates a real discrete event.

```css
@keyframes opponent-flash {
  0%   { background-color: var(--color-accent-muted); }
  100% { background-color: transparent; }
}
.opponent-progress-flash {
  animation: opponent-flash 400ms ease-out;
}
```

- Never animate the opponent's code or submission content directly — you
  do not show their code (per the WebSocket event contract in the
  roadmap, `opponent.solved` carries no code). The animation is purely on
  the indicator, not on any revealed content.

### 10.4 The match timer — the "pressure" pattern

This is the single most important motion moment in the product. The timer
is rendered as a segmented bar (see the gaming-UI mockup spec), and its
motion needs two distinct states:

**Normal countdown (>2 minutes remaining):**
- Segments deplete via a `width`/`scaleX` transform (use `scaleX` with
  `transform-origin: left`, not `width`, per Section 8) on
  `duration-base ease-snap` — smooth, not noticeable as an "animation,"
  just a clean depleting bar.
- The numeric time display ticks down using the `count-tick` pattern from
  Section 10.6 — each second change is a small, fast transform, not a
  re-render snap.

**Critical countdown (<2 minutes remaining):**
- Text color switches from `text-primary` to `accent` (per Section 3,
  item 5) — this switch itself transitions over `duration-base`, it does
  not snap.
- The numeric display gets a one-time `tick-flash` animation
  (color flickers toward accent and back) on every second tick, rather
  than the calmer `count-tick` used above 2 minutes. This is intentional
  escalation — the motion itself gets slightly more urgent as time runs
  out, mirroring the actual stakes.
- Do **not** add screen shake, a siren-red full-screen flash, or any
  full-viewport effect. The urgency lives entirely in the timer
  component — the rest of the screen (editor, problem panel) stays
  completely calm. This contrast is what makes the timer's urgency read
  as real rather than gimmicky.

```css
@keyframes tick-flash {
  0%   { color: var(--color-text-primary); }
  40%  { color: var(--color-accent); }
  100% { color: var(--color-text-primary); }
}
.timer-critical-tick {
  animation: tick-flash 600ms ease-out;
}
```

### 10.5 Entrances — the `rise-in` pattern

Used for: a submission verdict appearing, a toast notification, a quest
completion card, any panel/result appearing for the first time.

```css
@keyframes rise-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-rise-in {
  animation: rise-in 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

- 6px of vertical travel, nothing more dramatic. This is a settle, not an
  entrance "effect" — it should barely register consciously, it just
  keeps content from feeling like it was teleported in.
- This is the default entrance animation for the entire product. Do not
  invent a second entrance pattern (no fade-only, no slide-from-left, no
  scale-up) for a different component without a specific reason — one
  consistent entrance motion is part of what makes the product feel
  considered rather than assembled from disparate UI kits.

### 10.6 Numbers that change — the `count-tick` pattern

Used for: the match timer ticking, ELO updating after a match, a live
stat changing (online player count, problems-solved count).

- Because all numbers are `font-mono` with tabular figures (Section 6),
  digit changes never cause layout shift — this is a prerequisite for the
  animation to look clean.
- On change, the new digit value animates in via a brief vertical
  `count-tick`: opacity 0.4 → 1 and a 2px upward `translateY`, over
  `duration-fast`. This reads as "the number just ticked," not as a
  full re-render.

```css
@keyframes count-tick {
  from { transform: translateY(-2px); opacity: 0.4; }
  to   { transform: translateY(0); opacity: 1; }
}
.stat-value-tick {
  animation: count-tick 150ms ease-out;
}
```

- For an ELO delta specifically (e.g. "+18" or "−14" appearing after a
  match), the delta value uses `rise-in` (Section 10.5) since it's a
  one-time reveal, not a recurring tick — don't conflate the two
  patterns. `count-tick` is for *recurring* updates to a number that's
  already visible; `rise-in` is for a number's *first appearance*.

### 10.7 Tier-up — the one "earned" animation in the product

Used for: a player's ELO crosses a tier threshold (e.g. Silver → Gold)
after a match concludes.

This is the single exception to "motion is minimal and fast everywhere."
It happens rarely (not every match, only on threshold crossings) and
marks a genuinely significant moment, so it is allowed a slightly more
noticeable treatment — but still within the no-bounce, no-confetti,
no-particle-burst rules from Section 8.

- The new tier badge/icon animates in via `rise-in` (Section 10.5) but at
  `duration-slow` instead of `duration-base` — the only place a
  component is allowed to override the default duration for an entrance.
- The tier's border color (Section 5) transitions in via a
  `duration-slow ease-settle` color transition from the previous tier's
  color to the new one — this is the second and final place (besides
  10.3's opponent-flash) where a color-property transition is permitted
  rather than transform/opacity only, because it is a true one-time state
  change, not a recurring effect.
- Nothing else on screen moves during this moment. No confetti, no
  scale-bounce, no screen flash. The restraint **is** the payoff — a
  tier-up should feel like a quiet, earned, deliberate moment, the
  opposite of a slot-machine win animation.

### 10.8 What never animates

For completeness, the explicit "no" list for motion — these stay
perfectly static regardless of any state change:

- Navigation bar position, structure, or links
- The code editor's layout chrome (only the focus-border color, per
  Section 3 item 7, transitions — nothing about the editor's size or
  position ever animates)
- Leaderboard table row order during a single page view (if data
  refreshes, it can re-render; rows do not animate-reorder/shuffle past
  each other — that reads as a game-show effect, not a competitive tool)
- Any background or page-level decorative element — there are no
  ambient background animations anywhere in this product, full stop

### 10.9 Quick-reference cheat sheet — motion

```
Something is currently live (online count, active match)? → LiveDot pattern (10.2), the ONLY loop allowed
Opponent did something during a match?                     → opponent-flash (10.3)
The match timer needs to tick?                              → count-tick normally, tick-flash under 2 min (10.4)
A panel/verdict/toast is appearing for the first time?      → rise-in (10.5)
A visible number just changed?                               → count-tick (10.6)
A player just crossed a tier threshold?                      → the once-only tier-up treatment (10.7), nothing else
Anything else moving?                                         → it probably shouldn't be — re-check Section 10.0
```

---

*Last updated as part of the CodeWars MVP design system. Any change to
token values in Section 1 (color) or Section 2/10 (motion) must be
reflected consistently across the dark theme block, the light theme
block, and the Tailwind config simultaneously — they are not allowed to
drift independently. New animation patterns are not added ad hoc inside
a component; they are proposed as an addition to Section 10 first, with
a stated reason that fits the "what just happened?" test from Section 0.*