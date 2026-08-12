# Podium Pillars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/podium` as three equal-height pillars carrying idling venture logos over a rule-separated strip, and replace the Flea calendar drawing with a progress dial on both slides.

**Architecture:** Six tasks, each independently testable and committed. Tasks 1–3 build shared foundations (a programme anchor with countdown progress, a pure dial component, a shared team-ID hash). Tasks 4–5 build the podium itself (CSS tokens and keyframes, then the component). Task 6 is browser measurement, which is the only verification this project trusts for layout.

**Tech Stack:** Next.js (App Router, client components), React, TypeScript, Motion (not used for the idle), vitest + jsdom, Playwright for measurement, plain CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-08-12-podium-pillars-design.md`

## Global Constraints

- **Never hardcode a hex.** `.claude/skills/mesa-design/colors_and_type.css` is the only file that may contain one. Everything here uses `var(--token)` or `color-mix()` of tokens.
- **Class rules in `app/mesa-tv.css` go inside its `@layer components` block**, never at top level, or they beat every Tailwind utility.
- **Check every new class name against Tailwind utilities** before using it (`overline`, `truncate`, `container`, `block`, `grid`, `flex`, `fixed`, `static`, `visible`, …).
- **No `layout` / `layoutId` prop anywhere in the board tree.** `components/render.test.tsx` source-scans `Podium.tsx` for it and fails the build.
- **No spinners. No filler content. Empty is a valid state.**
- **Currency is `Intl.NumberFormat('en-IN')`** via `formatRupees` — `₹1,04,500`, never `₹104,500`.
- **Do not modify `app/weekly/page.tsx` or `components/WeeklyLeaderboard.tsx`.** `/weekly` changes only through the shared `FleaStrip`.
- **Verify layout by measuring the running app at 1920×1080**, never by reading source.
- Idle intensity is *playful*: `--idle-amp: 16`, `--idle-turn: 34`, `--idle-tilt: 9`.
- Ramp: pod 1 `var(--deep-forest-green)`, pod 2 `color-mix(in srgb, var(--green-600) 62%, var(--deep-forest-green))`, pod 3 `var(--bright-green)`.
- Commands: `npm run typecheck`, `npm run test`, `npx eslint app components lib`, `npm run build`.

---

## File Structure

| File | Responsibility |
|---|---|
| `config.ts` | Add `PROGRAMME_START_ISO` / `PROGRAMME_START_MS` — the dial's anchor. |
| `lib/countdown.ts` | Gains `progress` on `CountdownState`. Still the only place a threshold is decided. |
| `lib/seed.ts` | **New.** The team-ID hash, shared by logo tints and idle assignment. |
| `components/FleaDial.tsx` | **New.** Pure presentational dial: ring + figure. No clock. |
| `components/FleaStrip.tsx` | Keeps the clock and interval; renders `FleaDial`. Calendar SVG deleted. |
| `components/VentureLogo.tsx` | Uses `lib/seed.ts` instead of its inline hash. No visual change. |
| `app/mesa-tv.css` | Pod tokens, ramp, idle keyframes, strip rule, dial tokens. |
| `components/Podium.tsx` | Rewrite: pillars, ramp, idle, rule-separated strip. |

---

### Task 1: Programme anchor and countdown progress

**Files:**
- Modify: `config.ts`
- Modify: `lib/countdown.ts`
- Test: `lib/countdown.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `PROGRAMME_START_MS: number` from `config.ts`; `CountdownState` gains `progress: number` (0–1 inclusive); `computeCountdownState(fleaDatetime: number, now?: number, programmeStart?: number): CountdownState`.

- [ ] **Step 1: Write the failing tests**

Append to `lib/countdown.test.ts`:

```ts
describe('progress', () => {
  it('is 0 at the programme start and 1 at the Flea', () => {
    const start = Date.parse('2026-07-20T00:00:00+05:30')
    expect(computeCountdownState(FLEA, start).progress).toBe(0)
    expect(computeCountdownState(FLEA, FLEA - 1).progress).toBeCloseTo(1, 3)
  })

  it('is the elapsed fraction of the programme in between', () => {
    const start = Date.parse('2026-07-20T00:00:00+05:30')
    const halfway = start + (FLEA - start) / 2
    expect(computeCountdownState(FLEA, halfway).progress).toBeCloseTo(0.5, 3)
  })

  it('clamps rather than going negative before the programme starts', () => {
    expect(computeCountdownState(FLEA, Date.parse('2026-07-01T00:00:00+05:30')).progress).toBe(0)
  })

  it('is 1 once the event is live and after it is hidden', () => {
    expect(computeCountdownState(FLEA, FLEA + 1000).progress).toBe(1)
    expect(computeCountdownState(FLEA, FLEA + 9 * 60 * 60 * 1000).progress).toBe(1)
  })

  it('does not divide by zero when the Flea is at or before the anchor', () => {
    const start = Date.parse('2026-07-20T00:00:00+05:30')
    expect(computeCountdownState(start, start - 1000, start).progress).toBe(1)
  })
})
```

Then update the three existing `toEqual({...})` assertions in this file — they now need `progress`. Change each to drop the object comparison for the fields under test, e.g.:

```ts
    // was: expect(at('2026-08-12T12:00:00+05:30')).toEqual({ display: '25', mode: 'days', numeric: 25 })
    expect(at('2026-08-12T12:00:00+05:30')).toMatchObject({
      display: '25',
      mode: 'days',
      numeric: 25,
    })
```

Apply the same `toEqual` → `toMatchObject` change to every other whole-object assertion in the file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/countdown.test.ts`
Expected: FAIL — `progress` is `undefined`.

- [ ] **Step 3: Add the anchor to `config.ts`**

Insert after the `FLEA_EVENT_DURATION_MS` block:

```ts
/**
 * When the programme started — 20 July 2026, 00:00 IST.
 *
 * **This is a third copy of a date that already lives in two sheet cells**
 * (`TV_Feed!D2`, see docs/SHEET_SETUP.md) and in `docs/DESIGN.md`. It is here
 * only because the Flea dial needs something to measure progress *from*, and
 * the sheet publishes the Flea instant but not the programme's start. If the
 * anchor ever moves, it moves here too.
 *
 * Publishing it as a cohort key would remove the duplication, and was
 * deliberately not done: it changes the sheet contract for one decorative arc.
 */
export const PROGRAMME_START_ISO = '2026-07-20T00:00:00+05:30'
export const PROGRAMME_START_MS = Date.parse(PROGRAMME_START_ISO)
```

- [ ] **Step 4: Add `progress` to `lib/countdown.ts`**

Add to the import: `PROGRAMME_START_MS`.

Add to the `CountdownState` type, after `numeric`:

```ts
  /**
   * How far through the programme we are, 0 at the anchor and 1 at the Flea.
   * The dial's only input. Clamped, so a wall booted before the cohort opens
   * shows an empty ring rather than a negative arc.
   */
  progress: number
```

Add above `computeCountdownState`:

```ts
function programmeProgress(fleaDatetime: number, now: number, programmeStart: number): number {
  const span = fleaDatetime - programmeStart
  // A Flea at or before the anchor is a misconfigured sheet, not a countdown.
  // A full ring is the honest answer: there is no journey left to show.
  if (span <= 0) return 1
  const elapsed = (now - programmeStart) / span
  return Math.min(1, Math.max(0, elapsed))
}
```

Change the signature and every `return`:

```ts
export function computeCountdownState(
  fleaDatetime: number,
  now: number = Date.now(),
  programmeStart: number = PROGRAMME_START_MS,
): CountdownState {
  const progress = programmeProgress(fleaDatetime, now, programmeStart)

  if (now >= fleaDatetime + FLEA_EVENT_DURATION_MS) {
    return { display: '', mode: 'hidden', numeric: null, progress: 1 }
  }
  if (now >= fleaDatetime) {
    return { display: 'LIVE NOW', mode: 'live', numeric: null, progress: 1 }
  }
```

Then add `progress` to the three remaining returns (`timer`, `daysHours`, `days`) — each gets `, progress` appended to its object literal.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/countdown.test.ts && npm run typecheck`
Expected: PASS, typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add config.ts lib/countdown.ts lib/countdown.test.ts
git commit -m "The countdown learns how far through the programme it is"
```

---

### Task 2: The Flea dial

**Files:**
- Create: `components/FleaDial.tsx`
- Modify: `components/FleaStrip.tsx`
- Modify: `app/mesa-tv.css` (dial tokens only)
- Test: `components/render.test.tsx`

**Interfaces:**
- Consumes: `CountdownState` (with `progress`) from Task 1.
- Produces: `FleaDial({ state }: { state: CountdownState })` — a pure component, no clock, no interval.

- [ ] **Step 1: Write the failing test**

Append to `components/render.test.tsx` (add `FleaDial` to the imports from `@/components/FleaDial`):

```tsx
describe('FleaDial', () => {
  const state = (over: Partial<CountdownState>): CountdownState => ({
    display: '25', mode: 'days', numeric: 25, progress: 0.5, ...over,
  })

  it('puts the figure beside the ring in every mode, never inside it', () => {
    expect(render(<FleaDial state={state({})} />)).toContain('25 days')
    expect(render(<FleaDial state={state({ display: '9D 4H', mode: 'daysHours', numeric: 9 })} />))
      .toContain('9D 4H')
    expect(render(<FleaDial state={state({ display: '04:12:33', mode: 'timer', numeric: 300 })} />))
      .toContain('04:12:33')
    expect(render(<FleaDial state={state({ display: 'LIVE NOW', mode: 'live', numeric: null })} />))
      .toContain('LIVE NOW')
  })

  it('names the countdown for a screen reader', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() => root.render(<FleaDial state={state({})} />))
    const img = host.querySelector('[role="img"]')
    expect(img?.getAttribute('aria-label')).toBe('Time until Mesa Flea: 25 days')
    act(() => root.unmount())
    host.remove()
  })
})
```

Add the type import at the top of the file: `import type { CountdownState } from '@/lib/countdown'`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/render.test.tsx -t FleaDial`
Expected: FAIL — cannot resolve `@/components/FleaDial`.

- [ ] **Step 3: Add the dial's tokens to `app/mesa-tv.css`**

Inside `:root`, replacing the four `--t-tv-cal-*` figure tokens:

```css
  /* The Mesa Flea dial. One ring at a constant diameter and one figure beside
     it, in every mode — so the header band's height never changes as the date
     approaches and nothing relocates at a threshold nobody is awake to watch.
     This replaces a 52x40 calendar drawing whose binding rings, at 44px on a
     1920 frame, read as speckle rather than as a calendar. */
  --h-tv-cal: clamp(26px, 2.3vw, 48px);
  --w-tv-cal-stroke: 5;
  --t-tv-cal-figure: 800 clamp(11px, 1vw, 21px) / 1 var(--font-sans);
```

Delete `--t-tv-cal-day`, `--t-tv-cal-unit`, `--t-tv-cal-mid`, `--t-tv-cal-timer`.

- [ ] **Step 4: Create `components/FleaDial.tsx`**

```tsx
import type { CountdownState } from '@/lib/countdown'

/**
 * How long until the Mesa Flea: a progress ring, and a figure beside it.
 *
 * **The ring never contains text.** It is a dial and nothing else, and the
 * figure always sits to its right — `25 days`, `9D 4H`, `04:12:33`,
 * `LIVE NOW`. Every mode therefore has identical structure, which is the whole
 * reason this shape was chosen over the prettier one that puts short numbers
 * inside the ring: the wall crosses these thresholds at three in the morning
 * with nobody watching, and a layout that rearranges itself at a threshold is
 * a layout that can break unobserved for days.
 *
 * The arc measures elapsed *programme* time — anchor to Flea — not an
 * arbitrary trailing window, so a half-full ring means the cohort is half over
 * and says something true rather than decorative.
 *
 * Pure of the clock. `FleaStrip` owns the interval; this draws one state.
 */

/** The arc's geometry. A `viewBox` scaled uniformly keeps the ring round at
    every size, so the one token `--h-tv-cal` is the only dimension. */
const R = 19.5
const CIRCUMFERENCE = 2 * Math.PI * R

function figureOf(state: CountdownState): string {
  // Days mode carries a bare count, because that is what the escalation in
  // lib/countdown.ts publishes; the unit belongs to the presentation. It is
  // never singular — days mode only runs at 15 days and beyond.
  return state.mode === 'days' ? `${state.display} days` : state.display
}

function labelOf(state: CountdownState): string {
  if (state.mode === 'live') return 'Mesa Flea is live now'
  return `Time until Mesa Flea: ${figureOf(state)}`
}

export function FleaDial({ state }: { state: CountdownState }) {
  // Tangerine from the final day onward: urgency arrives as a colour change on
  // a shape that never moves, rather than as a new shape.
  const urgent = state.mode === 'timer' || state.mode === 'live'
  const arc = urgent ? 'var(--tangerine-600)' : 'var(--deep-forest-green)'

  return (
    <span
      role="img"
      aria-label={labelOf(state)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)' }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 46 46"
        style={{ height: 'var(--h-tv-cal)', width: 'var(--h-tv-cal)', display: 'block', flex: 'none' }}
      >
        <circle
          cx="23"
          cy="23"
          r={R}
          fill="none"
          stroke="var(--soft-mint)"
          strokeWidth="var(--w-tv-cal-stroke)"
        />
        <circle
          cx="23"
          cy="23"
          r={R}
          fill="none"
          stroke={arc}
          strokeWidth="var(--w-tv-cal-stroke)"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          // Drawn from the top, clockwise, like a clock rather than like a chart.
          strokeDashoffset={CIRCUMFERENCE * (1 - state.progress)}
          transform="rotate(-90 23 23)"
        />
      </svg>
      <span
        className="tv-figure"
        style={{ font: 'var(--t-tv-cal-figure)', color: urgent ? 'var(--tangerine-600)' : 'var(--fg1)' }}
      >
        {figureOf(state)}
      </span>
    </span>
  )
}
```

- [ ] **Step 5: Replace the drawing in `components/FleaStrip.tsx`**

Delete the entire `CalendarPage` function and the `ariaFor` function. Add the import `import { FleaDial } from '@/components/FleaDial'`. In the returned JSX, replace `<CalendarPage state={state} />` with `<FleaDial state={state} />`. Leave the label, the clock, the interval, the dev skew and all four early returns exactly as they are.

- [ ] **Step 6: Run tests**

Run: `npx vitest run && npm run typecheck && npx eslint app components lib`
Expected: PASS, clean.

- [ ] **Step 7: Commit**

```bash
git add components/FleaDial.tsx components/FleaStrip.tsx app/mesa-tv.css components/render.test.tsx
git commit -m "The Flea calendar becomes a dial, on both slides"
```

---

### Task 3: Share the team-ID hash

**Files:**
- Create: `lib/seed.ts`
- Create: `lib/seed.test.ts`
- Modify: `components/VentureLogo.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `hashTeamId(teamId: string): number` — a non-negative integer, stable across reloads and processes.

- [ ] **Step 1: Write the failing test**

Create `lib/seed.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { hashTeamId } from '@/lib/seed'

describe('hashTeamId', () => {
  it('is stable for the same id', () => {
    expect(hashTeamId('SLE-C401')).toBe(hashTeamId('SLE-C401'))
  })

  it('separates neighbouring ids', () => {
    expect(hashTeamId('SLE-C401')).not.toBe(hashTeamId('SLE-C402'))
  })

  it('is non-negative, so it is safe as a modulo index', () => {
    for (const id of ['SLE-C401', 'SLE-C442', '', 'A']) {
      expect(hashTeamId(id)).toBeGreaterThanOrEqual(0)
    }
  })

  it('matches the hash VentureLogo shipped with, so no tint moves', () => {
    // Locked deliberately: this hash already decides every venture's colour on
    // a wall people have been looking at. Changing it would resassign 42 tints.
    expect(hashTeamId('SLE-C401') % 6).toBe(3)
    expect(hashTeamId('SLE-C435') % 6).toBe(1)
  })
})
```

- [ ] **Step 2: Run it to see it fail, and to learn the real expected values**

Run: `npx vitest run lib/seed.test.ts`
Expected: FAIL — module not found. After Step 3 the last assertion may also fail; if it does, **replace the two expected numbers with the actual output** rather than changing the hash. The point of that test is to pin current behaviour, not to assert a particular number.

- [ ] **Step 3: Create `lib/seed.ts`**

```ts
/**
 * One stable number per team, for everything that must look arbitrary but
 * never change.
 *
 * A venture's mark colour and its idle timeline are both drawn from this. Both
 * have the same requirement: spread the cohort out, and give the same team the
 * same answer forever. Assigned by rank instead, a venture would change colour
 * and change how it moves the moment it was overtaken — and a mark that
 * changes on promotion reads as a different venture.
 *
 * Lifted verbatim out of `VentureLogo.tintFor`, where it used to live inline.
 * The exact arithmetic is load-bearing: it already decides all 42 tints on a
 * wall people have been looking at, and `lib/seed.test.ts` pins it.
 */
export function hashTeamId(teamId: string): number {
  let hash = 0
  for (let index = 0; index < teamId.length; index += 1) {
    hash = (hash * 31 + teamId.charCodeAt(index)) >>> 0
  }
  return hash
}
```

- [ ] **Step 4: Point `VentureLogo` at it**

In `components/VentureLogo.tsx`, add `import { hashTeamId } from '@/lib/seed'` and replace the body of `tintFor`:

```ts
function tintFor(teamId: string): string {
  return TINTS[hashTeamId(teamId) % TINTS.length]
}
```

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run && npm run typecheck`
Expected: PASS. Every existing render test still passes, which is the evidence that no tint moved.

- [ ] **Step 6: Commit**

```bash
git add lib/seed.ts lib/seed.test.ts components/VentureLogo.tsx
git commit -m "Lift the team hash out of VentureLogo so the idle can share it"
```

---

### Task 4: Podium tokens, ramp and idle keyframes

**Files:**
- Modify: `app/mesa-tv.css`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties `--w-pod`, `--w-pod-shaft`, `--w-pod-slab`, `--h-pod-shaft`, `--h-pod-slab`, `--s-pod-gap`, `--w-pod-board`, `--pod-1`, `--pod-2`, `--pod-3`, `--slab-1`, `--slab-2`, `--slab-3`, type tokens `--t-tv-pod-rank`, `--t-tv-pod-name`, `--t-tv-pod-figure`, `--t-tv-pod-label`, `--t-tv-pod-row-*`; classes `.tv-pod-shaft`, `.tv-pod-slab`, `.tv-idle-1|2|3`.

- [ ] **Step 1: Replace the podium token block in `:root`**

Delete the `/* ========= PODIUM BAND ========= */` block added in `fb434cb` (from `--w-podium-1` through `--t-tv-podium-row-figure`) and put this in its place:

```css
  /* ========= PODIUM PILLARS =========

     Three columns with a capital and a base, standing apart, each carrying a
     venture's mark on top. **All three are identical in size**: rank is
     carried by colour, by the mark's diameter and by the numeral, never by
     height. Stated in `vw` like everything else here so the frame composes
     the same at 1920 and in a dev window; each lands on its target at exactly
     1920 (19.79vw is 380px, 11.98vw is 230px, and so on).

     The slabs are deliberately wider than the shaft. That overhang is the
     whole difference between reading as a column and reading as a bar. */
  --w-pod: 19.79vw;
  --w-pod-shaft: 11.46vw;
  --w-pod-slab: 12.92vw;
  --h-pod-shaft: 11.98vw;
  --h-pod-slab: 0.73vw;
  --s-pod-gap: 4.69vw;

  /* The board's horizontal extent — three pods and the two gaps, 1320px at
     1920. The strip below is set to exactly this, so ranks 4-10 read as a
     continuation of the podium rather than as a second object. */
  --w-pod-board: calc(3 * var(--w-pod) + 2 * var(--s-pod-gap));
  --w-pod-total: 8vw;

  /* ── The ramp ──

     Deepest at first, lightest at third. Two of the three are brand tokens
     outright; only the middle is derived, and it is derived by formula rather
     than written as a literal, which is what keeps the no-hardcoded-hex rule
     intact. 62% is the closest single mix to the approved swatch — see the
     spec; raise it toward 68% if pod 2 reads dull beside pod 3.

     Each slab is the next darker step of the same ramp, so a slab is always
     "this pod, in shadow" and never a second decorative system. */
  --pod-1: var(--deep-forest-green);
  --pod-2: color-mix(in srgb, var(--green-600) 62%, var(--deep-forest-green));
  --pod-3: var(--bright-green);
  --slab-1: var(--deep-teal);
  --slab-2: var(--pod-1);
  --slab-3: var(--pod-2);

  /* Podium type. Heavy — 800 is the top of MesaBody's declared axis — because
     a rank numeral at this size is a shape before it is a number. */
  --t-tv-pod-rank: 800 clamp(30px, 3.33vw, 70px) / 1 var(--font-sans);
  --t-tv-pod-name: 600 clamp(14px, 1.35vw, 28px) / 1.15 var(--font-sans);
  --t-tv-pod-figure: 800 clamp(20px, 2.19vw, 46px) / 1 var(--font-sans);
  --t-tv-pod-label: 700 clamp(9px, 0.573vw, 12px) / 1 var(--font-sans);
  --t-tv-pod-row-name: 500 clamp(12px, 1.15vw, 24px) / 1.1 var(--font-sans);
  --t-tv-pod-row-figure: 600 clamp(12px, 1.15vw, 24px) / 1 var(--font-sans);

  /* ── Idle intensity: "playful" ──

     Unitless, so one set of keyframes serves any intensity through `calc()`.
     Amplitude in px, angles in deg. */
  --idle-amp: 16;
  --idle-turn: 34;
  --idle-tilt: 9;
```

- [ ] **Step 2: Amend the two comments this change invalidates**

In the `--bright-green` note at the bottom of `:root`, append:

```
     **Amended for the podium.** Pod 3 uses `--bright-green` as a large filled
     shape on white, with a dark numeral on it. The 1.9:1 figure above is a
     *text* contrast measurement and does not govern a filled pillar. The real
     risk there is a soft edge against white, which is checked by measurement
     rather than assumed — see docs/superpowers/specs/2026-08-12-podium-pillars-design.md.
     The ban still stands for any figure or label set in it.
```

And above `@keyframes tv-breathe`, change "The only animation defined in CSS rather than in Motion" to:

```
/* Animations defined in CSS rather than in Motion, for one shared reason: both
   run forever, unrelated to any state change, and handing a permanent loop to
   a JS animation loop keeps the main thread busy for the life of a page that
   never reloads. Everything event-driven is still Motion's. */
```

- [ ] **Step 3: Add the idle keyframes, after `tv-breathe`**

```css
/* ── The podium idle ──

   Three timelines built from one repertoire — bob, glance left, glance right,
   double-take, tilt — so the marks read as alive rather than as a loop. The
   glance is a `rotateY` under a container `perspective`, which turns the mark's
   *face*; sliding it sideways instead reads as drift, not as looking.

   Durations differ (17s / 19s / 23s) rather than merely being offset, so the
   three never fall into step and the pattern does not visibly repeat. Which
   one a venture gets is seeded from its team id, so a venture always idles the
   same way — see lib/seed.ts. */

@keyframes tv-idle-1 {
  0%, 4%   { transform: translateY(0) rotateY(0deg) rotate(0deg); }
  9%       { transform: translateY(calc(var(--idle-amp) * -1px)); }
  15%      { transform: translateY(0); }
  20%      { transform: translateY(calc(var(--idle-amp) * -0.55px)); }
  26%, 33% { transform: translateY(0); }
  40%, 52% { transform: translateY(calc(var(--idle-amp) * -0.2px)) rotateY(calc(var(--idle-turn) * -1deg)); }
  59%, 68% { transform: translateY(0) rotateY(0deg); }
  76%      { transform: translateY(calc(var(--idle-amp) * -0.8px)) rotate(calc(var(--idle-tilt) * -1deg)); }
  84%      { transform: translateY(0) rotate(calc(var(--idle-tilt) * -0.3deg)); }
  92%,100% { transform: translateY(0) rotate(0deg); }
}

@keyframes tv-idle-2 {
  0%, 7%   { transform: translateY(0) rotateY(0deg) rotate(0deg); }
  14%, 24% { transform: rotateY(calc(var(--idle-turn) * 1deg)) rotate(calc(var(--idle-tilt) * 0.25deg)); }
  31%      { transform: rotateY(0deg) rotate(0deg); }
  37%      { transform: translateY(calc(var(--idle-amp) * -1px)); }
  43%, 49% { transform: translateY(0); }
  /* the double-take: a glance, back, then commit to the look */
  54%      { transform: rotateY(calc(var(--idle-turn) * -0.45deg)); }
  59%      { transform: rotateY(0deg); }
  66%, 79% { transform: translateY(calc(var(--idle-amp) * -0.25px)) rotateY(calc(var(--idle-turn) * -1deg)) rotate(calc(var(--idle-tilt) * -0.3deg)); }
  87%,100% { transform: translateY(0) rotateY(0deg) rotate(0deg); }
}

@keyframes tv-idle-3 {
  0%       { transform: translateY(0) rotateY(0deg) rotate(0deg); }
  5%       { transform: translateY(calc(var(--idle-amp) * -0.75px)); }
  10%      { transform: translateY(0); }
  15%      { transform: translateY(calc(var(--idle-amp) * -0.9px)); }
  20%      { transform: translateY(0); }
  25%      { transform: translateY(calc(var(--idle-amp) * -0.5px)); }
  31%, 38% { transform: translateY(0); }
  /* the sweep: all the way left, across to right, then home */
  46%, 53% { transform: rotateY(calc(var(--idle-turn) * -1deg)); }
  63%, 70% { transform: rotateY(calc(var(--idle-turn) * 1deg)); }
  78%      { transform: rotate(calc(var(--idle-tilt) * 1deg)); }
  86%,100% { transform: rotateY(0deg) rotate(0deg); }
}
```

- [ ] **Step 4: Add the classes inside `@layer components`**

Delete `.tv-podium-crown` and `.tv-podium-flank` (added in `fb434cb`, now unused). Add:

```css
  /* A pillar's shaft. The colour arrives per-pod as an inline custom property,
     so one class serves all three and the ramp stays in `:root`. */
  .tv-pod-shaft {
    background: var(--pod-fill);
    border-radius: var(--radius-xs);
  }

  /* Capital and base. Wider than the shaft, and one step darker than it. */
  .tv-pod-slab {
    background: var(--slab-fill);
    border-radius: var(--radius-xs);
  }

  .tv-idle-1 { animation: tv-idle-1 17s ease-in-out infinite; }
  .tv-idle-2 { animation: tv-idle-2 19s ease-in-out infinite -6s; }
  .tv-idle-3 { animation: tv-idle-3 23s ease-in-out infinite -13s; }

  /* Someone will eventually drive this wall from a machine with the OS
     accessibility setting on, and a permanently moving logo is exactly what
     that setting exists to stop. */
  @media (prefers-reduced-motion: reduce) {
    .tv-idle-1, .tv-idle-2, .tv-idle-3 { animation: none; }
  }
```

- [ ] **Step 5: Verify the sheet still compiles and nothing regressed**

Run: `npm run build && npx vitest run`
Expected: build succeeds, tests pass. (`Podium.tsx` still references the deleted classes at this point — that is fine, they are strings; Task 5 replaces them. If the build fails for any other reason, fix before committing.)

- [ ] **Step 6: Commit**

```bash
git add app/mesa-tv.css
git commit -m "Tokens for the pillars: a green ramp and three idle timelines"
```

---

### Task 5: The pillars

**Files:**
- Modify: `components/Podium.tsx` (full rewrite)
- Test: `components/render.test.tsx`

**Interfaces:**
- Consumes: `hashTeamId` (Task 3), the tokens and classes (Task 4), `VentureLogo`, `formatRupees`.
- Produces: `Podium({ ranked }: { ranked: readonly Team[] })`, `podiumTeams(ranked: readonly Team[]): Team[]`.

- [ ] **Step 1: Write the failing tests**

Replace the existing `describe('Podium', …)` block in `components/render.test.tsx` with:

```tsx
describe('Podium', () => {
  it('renders the top three with names, ranks and revenue', () => {
    const text = render(<Podium ranked={rankTeams(TRADING)} />)
    expect(text).toContain('Aurora Bakes')
    expect(text).toContain('Kite Coffee')
    expect(text).toContain('Solstice')
    expect(text).toContain(formatRupees(240_000))
    expect(text.toLowerCase()).toContain('total revenue')
  })

  it('ranks 4-10 land in the strip, in order, and 11 does not', () => {
    const all = teams().map((row, index) => ({ ...row, totalRevenue: 1_000 * (42 - index) }))
    const text = render(<Podium ranked={rankTeams(competingTeams(all))} />)
    expect(text).toContain('Venture 4')
    expect(text).toContain('Venture 10')
    expect(text).not.toContain('Venture 11')
  })

  it('carries none of the weekly board pill', () => {
    // The pill is /weekly's language — forty rows that close around their own
    // logo during a kick. Borrowing it here made slide 1 look like a shorter
    // slide 2. This is the executable form of "do not borrow it back".
    const all = teams().map((row, index) => ({ ...row, totalRevenue: 1_000 * (42 - index) }))
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() => root.render(<Podium ranked={rankTeams(competingTeams(all))} />))
    expect(host.querySelectorAll('.tv-pill')).toHaveLength(0)
    expect(host.querySelectorAll('.tv-pod-shaft')).toHaveLength(3)
    act(() => root.unmount())
    host.remove()
  })

  it('gives each of the three marks its own idle timeline', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    act(() => root.render(<Podium ranked={rankTeams(TRADING)} />))
    const idling = [...host.querySelectorAll('[class*="tv-idle-"]')]
    expect(idling).toHaveLength(3)
    act(() => root.unmount())
    host.remove()
  })

  it('renders the waiting board when nobody has traded', () => {
    const text = render(<Podium ranked={rankTeams(teams())} />)
    expect(text).toContain('—')
    expect(text).not.toContain(formatRupees(0))
    expect(text.toLowerCase()).not.toContain('no data')
  })

  it('renders three pillars with no feed at all', () => {
    const text = render(<Podium ranked={[]} />)
    expect(text.match(/—/g)).toHaveLength(3)
  })
})
```

Keep the existing `describe('podiumTeams', …)` block unchanged.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/render.test.tsx -t Podium`
Expected: FAIL — no `.tv-pod-shaft`, no `tv-idle-` elements.

- [ ] **Step 3: Rewrite `components/Podium.tsx`**

```tsx
'use client'

import { VentureLogo } from '@/components/VentureLogo'
import { formatRupees } from '@/lib/format'
import { hashTeamId } from '@/lib/seed'
import type { Team } from '@/lib/types'

/**
 * Slide 1 — the absolute leaderboard: three pillars, and ranks 4-10 below.
 *
 * Each venture's mark stands on a column with a capital and a base, and idles
 * there. **The three pillars are identical in size.** Rank is carried by the
 * green ramp, by the mark's diameter and by the numeral — never by height,
 * which is what the person this was designed with asked for and what stops the
 * board reading as three unrelated cards.
 *
 * ── What this deliberately spends ──
 *
 * This wall's rule is that movement means something happened, and the whole
 * overtake kick rests on it. A permanently idling mark spends that rule. It
 * was chosen knowingly: the idle is slow and small where the kick is fast,
 * large and directional, so the two stay distinguishable. If the kick ever
 * stops landing once both are on screen, the idle is what gives.
 *
 * **No `layout` prop**, here or anywhere in the board tree — see the source
 * scan in render.test.tsx. The idle is CSS keyframes on `transform` only, so
 * it is compositor work rather than a JS loop running for weeks.
 */

const TOP = 10
const PODIUM_PLACES = 3

/** The strip's mark, matching the weekly board's row exactly. The *scale*
    matches so the two boards feel like one wall; the decoration differs so
    they read as two different boards. */
const STRIP_LOGO = 30

/** The mark on a pillar. First place's is larger — one of the two things left
    carrying rank now that all three columns are the same height. */
const POD_LOGO_FIRST = 132
const POD_LOGO_REST = 104

const IDLE_TIMELINES = ['tv-idle-1', 'tv-idle-2', 'tv-idle-3'] as const

/**
 * Who is on the board. The top ten of whatever it is handed, and nothing else.
 *
 * The three pillars render whether or not anyone is trading: a podium with
 * second and third missing tells a passer-by the wall is broken, where three
 * pillars reading "—" tell them the cohort has not started. Filtering the
 * spares and ranking are both the caller's job.
 */
export function podiumTeams(ranked: readonly Team[]): Team[] {
  return ranked.slice(0, TOP)
}

/**
 * An em dash, not `₹0`. Zero is a figure, and a pillar carrying one asserts
 * that the team traded and earned nothing — which before the cohort opens is
 * false for all forty of them.
 */
function revenueOf(team: Team | undefined): string {
  if (team === undefined || team.totalRevenue <= 0) return '—'
  return formatRupees(team.totalRevenue)
}

/** Seeded off the team id, so a venture always idles the same way — exactly as
    it always gets the same tint, and for the same reason. */
function idleOf(team: Team | undefined, place: number): string {
  const seed = team === undefined ? place : hashTeamId(team.teamId)
  return IDLE_TIMELINES[seed % IDLE_TIMELINES.length]
}

/** "TOTAL REVENUE", over every figure on the slide. `/podium` ranks on all-time
    revenue and `/weekly` on the week's, and the two rotate on one screen
    minutes apart; without this the only difference is which numbers are bigger. */
function Caption({ align }: { align: 'center' | 'right' }) {
  return (
    <span
      style={{
        font: 'var(--t-tv-pod-label)',
        letterSpacing: 'var(--track-overline)',
        textTransform: 'uppercase',
        color: 'var(--fg-muted)',
        textAlign: align,
        display: 'block',
      }}
    >
      Total revenue
    </span>
  )
}

/**
 * One pillar.
 *
 * The mark sits in a fixed-height row and is bottom-aligned inside it, which
 * is what lets first place have a larger mark while all three capitals still
 * land on one line. Aligning the marks by their tops instead would stagger
 * every slab, shaft and figure on the frame.
 */
function Pillar({ team, place }: { team: Team | undefined; place: number }) {
  const first = place === 1
  const logo = first ? POD_LOGO_FIRST : POD_LOGO_REST
  return (
    <div style={{ width: 'var(--w-pod)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* The mark's row. Its height is first place's diameter whatever this
          pillar's own mark measures, so the capital line below is shared. */}
      <div
        style={{
          height: POD_LOGO_FIRST,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          marginBottom: 'var(--s-4)',
        }}
      >
        {/* An empty box where a mark would go holds the stack's geometry
            steady between "no feed yet" and the first snapshot, so the pillar
            does not visibly assemble itself on the wall's first paint. Empty
            rather than a placeholder mark — a grey circle is filler. */}
        {team === undefined ? (
          <div style={{ width: logo, height: logo }} />
        ) : (
          <div className={idleOf(team, place)} style={{ willChange: 'transform' }}>
            <VentureLogo team={team} size={logo} />
          </div>
        )}
      </div>

      <div className="tv-pod-slab" style={{ width: 'var(--w-pod-slab)', height: 'var(--h-pod-slab)' }} />
      <div
        className="tv-pod-shaft"
        style={{
          width: 'var(--w-pod-shaft)',
          height: 'var(--h-pod-shaft)',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 'var(--s-4)',
        }}
      >
        <span
          className="tv-figure"
          style={{
            font: 'var(--t-tv-pod-rank)',
            // Light on the deep pillar, dark on the two light ones — the same
            // rule VentureLogo already applies to its light tints.
            color: first ? 'var(--soft-mint)' : 'var(--deep-teal)',
          }}
        >
          {place}
        </span>
      </div>
      <div className="tv-pod-slab" style={{ width: 'var(--w-pod-slab)', height: 'var(--h-pod-slab)' }} />

      <div style={{ marginTop: 'var(--s-5)', width: '100%', textAlign: 'center' }}>
        <span
          style={{
            font: 'var(--t-tv-pod-name)',
            color: 'var(--deep-teal)',
            display: 'block',
            // Clipped, never wrapped: every pillar is a fixed stack and a
            // second line pushes the figure out of it, and the figure is why
            // the pillar exists.
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {team === undefined ? '' : team.ventureName || team.teamId}
        </span>
        <div style={{ marginTop: 'var(--s-2)' }}>
          <Caption align="center" />
          <span
            className="tv-figure"
            style={{
              font: 'var(--t-tv-pod-figure)',
              color: 'var(--tangerine-600)',
              display: 'block',
              marginTop: 'var(--s-1)',
            }}
          >
            {revenueOf(team)}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * The three pillars, 2 · 1 · 3 outward from the centre — the arrangement
 * everyone already knows from a real podium, so nobody has to work out the
 * order. `perspective` lives here because the idle's glance is a `rotateY`,
 * and without a perspective ancestor it flattens into a horizontal squash.
 */
function PodiumBand({ places }: { places: (Team | undefined)[] }) {
  const [first, second, third] = places
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 'var(--s-pod-gap)',
        perspective: '900px',
        // The ramp, applied per pillar. One class reads `--pod-fill`, so the
        // colours stay in :root rather than being spelled out three times here.
        ['--pod-fill' as string]: 'var(--pod-1)',
      }}
    >
      <div style={{ ['--pod-fill' as string]: 'var(--pod-2)', ['--slab-fill' as string]: 'var(--slab-2)' }}>
        <Pillar team={second} place={2} />
      </div>
      <div style={{ ['--pod-fill' as string]: 'var(--pod-1)', ['--slab-fill' as string]: 'var(--slab-1)' }}>
        <Pillar team={first} place={1} />
      </div>
      <div style={{ ['--pod-fill' as string]: 'var(--pod-3)', ['--slab-fill' as string]: 'var(--slab-3)' }}>
        <Pillar team={third} place={3} />
      </div>
    </div>
  )
}

/**
 * Ranks 4-10.
 *
 * **No pill.** `.tv-pill` is the weekly board's language — forty rows that
 * close around their own mark during a kick — and borrowing it here made slide
 * 1 look like a shorter slide 2. A hairline between rows is enough: the row
 * height and the mark still match `/weekly` exactly, so the scale reads as one
 * wall while the decoration says these are two different boards.
 */
function Strip({ teams, fromRank }: { teams: readonly Team[]; fromRank: number }) {
  // An empty strip carries no heading. Apparatus describing absence is the
  // same filler as a "no data" message, in a smaller typeface.
  if (teams.length === 0) return null

  const row: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `var(--w-rank) ${STRIP_LOGO}px minmax(0, 1fr) var(--w-pod-total)`,
    alignItems: 'center',
    gap: 'var(--s-3)',
    height: 'var(--h-row)',
  }

  return (
    <div style={{ width: 'var(--w-pod-board)', marginInline: 'auto' }}>
      <div style={{ ...row, height: 'var(--h-col-head)', alignItems: 'end' }}>
        <span />
        <span />
        <span />
        <Caption align="right" />
      </div>

      {teams.map((team, index) => (
        <div
          key={team.teamId}
          style={{
            ...row,
            borderBottom: index === teams.length - 1 ? 'none' : 'var(--stroke-hair) solid var(--border)',
          }}
        >
          <span
            className="tv-figure"
            style={{
              font: 'var(--t-tv-row-rank)',
              // One colour for all seven, matching the weekly board's ranks
              // exactly. The rank is board apparatus, not a tier.
              color: 'var(--midnight-charcoal)',
              textAlign: 'right',
            }}
          >
            {fromRank + index}
          </span>
          <VentureLogo team={team} size={STRIP_LOGO} />
          <span
            style={{
              font: 'var(--t-tv-pod-row-name)',
              color: 'var(--fg1)',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {team.ventureName || team.teamId}
          </span>
          <span
            className="tv-figure"
            style={{
              font: 'var(--t-tv-pod-row-figure)',
              // Black down here, gold only on the podium. Gold on all ten would
              // make the top three ordinary.
              color: 'var(--midnight-charcoal)',
              textAlign: 'right',
            }}
          >
            {revenueOf(team)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function Podium({ ranked }: { ranked: readonly Team[] }) {
  const visible = podiumTeams(ranked)
  // Explicit indices, not a destructure: the three pillars have to exist
  // before the feed does, and `slice` on an empty list yields nothing to
  // destructure. `undefined` is the pillar's empty state, and it is a real one.
  const places = [visible[0], visible[1], visible[2]]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'auto auto',
        alignContent: 'center',
        gap: 'var(--s-10)',
        height: '100%',
      }}
    >
      <PodiumBand places={places} />
      <Strip teams={visible.slice(PODIUM_PLACES)} fromRank={PODIUM_PLACES + 1} />
    </div>
  )
}
```

- [ ] **Step 4: Add the hairline token**

`--stroke-hair` does not exist. In `app/mesa-tv.css`, inside `:root`, next to the pod tokens:

```css
  /* A rule between strip rows. Thinner than --stroke-thin: this separates
     rows, it does not draw a shape around them. */
  --stroke-hair: 1px;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run && npm run typecheck && npx eslint app components lib && npm run build`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add components/Podium.tsx components/render.test.tsx app/mesa-tv.css
git commit -m "The podium becomes three pillars with marks idling on top"
```

---

### Task 6: Measure it

**Files:**
- No source changes unless a measurement fails.

**Interfaces:**
- Consumes: everything above.
- Produces: a measurement report; source fixes only if something is off.

- [ ] **Step 1: Serve the mock feed and start the dev server**

`config.ts` in the working tree already points at `http://localhost:3000/mock/*.csv`. Confirm the dev server is up on :3000 (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/podium` → `200`). **Do not commit `config.ts`.**

- [ ] **Step 2: Measure `/podium` at a true 1920×1080**

The Playwright MCP browser in this environment has a forced 5760×3240 viewport at DPR 0.33, which makes every `vw` token measure 3× too large. Drive Playwright directly instead, with `playwright-core` and the cached Chrome for Testing binary. Assert:

1. `scrollWidth`/`scrollHeight` === 1920/1080, and no element's rect falls outside the frame.
2. The three `.tv-pod-shaft` boxes have **identical width and height**, and all three `.tv-pod-slab` capitals share one `y`.
3. The three shafts' computed `background-color` are **three distinct values**, and pod 2's relative luminance sits between pod 1's and pod 3's. Sample the computed colour — do not trust the `color-mix()` declaration.
4. `document.querySelectorAll('.tv-pill').length === 0` on `/podium`, while row height and logo diameter still equal `/weekly`'s (44.16px and 30px).
5. `formatRupees(100000)` renders `₹1,00,000`.
6. Exactly three elements match `[class*="tv-idle-"]`, with three different computed `animation-duration` values (17s/19s/23s), and `animation-name` starting `tv-idle-`.
7. Podium extent === strip width === 1320px (±2px).

- [ ] **Step 3: Check the two accepted risks by eye**

Screenshot `/podium` at 1920×1080 and look at it:
- **Pod 3's edge against white.** If the pillar looks like it is dissolving, add `border: var(--stroke-thin) solid var(--slab-3)` to `.tv-pod-shaft` and re-measure. Do **not** reach for a different green — the ramp was approved.
- **Pod 2's saturation beside pod 3.** If it reads dull, raise the `color-mix` ratio toward 68%.

- [ ] **Step 4: Verify the dial in all four modes, on both slides**

`FleaStrip` accepts a dev clock skew via `?now=` in development. Load each and screenshot the header:

```
/podium?now=2026-08-12T12:00:00+05:30   → days      "25 days"
/podium?now=2026-09-01T12:00:00+05:30   → daysHours "5D 0H"
/podium?now=2026-09-06T06:00:00+05:30   → timer     "04:00:00", tangerine
/podium?now=2026-09-06T12:00:00+05:30   → live      "LIVE NOW", full ring
```

Assert the header's measured height is **identical in all four**, and identical between `/podium` and `/weekly`.

- [ ] **Step 5: Data extremes**

Swap `public/mock/feed.csv` for each case, measure, then **restore the original**:
- header-only feed (fails the 40-row gate) → header + three empty pillars, `—`, no spinner
- all figures zero → three pillars, `—` everywhere, seven strip rows
- a >25-character venture name on ranks 1, 2 and 4 → ellipsis, no overflow, pillar boxes unchanged

- [ ] **Step 6: Confirm `/weekly` moved only where intended**

Measure `/weekly` and diff against the numbers recorded in `fb434cb`'s report: header box `{x:48, y:40, w:1824, h:65.27}`, pill `650.64×44.16` with `radius 22.08px`, logo `30×30`. Only the countdown should differ.

- [ ] **Step 7: Commit any fixes, and the report**

```bash
git add -A ':!config.ts'
git commit -m "Measured at 1920x1080: <what moved, or 'nothing>'"
```

---

## Self-Review

**Spec coverage.** §3.1 frame → Task 5 (`Podium` grid) + unchanged `page.tsx`. §3.2 pillars → Task 5 `Pillar`, dimensions in Task 4. §3.3 ramp → Task 4 tokens, applied Task 5 `PodiumBand`; numeral flip → Task 5. §3.4 idle → Task 4 keyframes, Task 3 seed, Task 5 `idleOf`. §3.5 strip → Task 5 `Strip`. §3.6 dial → Tasks 1–2. §4.1 movement rule → documented in `Podium.tsx` docblock. §4.2 bright-green → Task 4 Step 2 comment amendment + Task 6 Step 3 eye check. §4.3 anchor duplication → Task 1 Step 3 comment. §6 states → Task 5 tests + Task 6 Step 5. §7 verification → Task 6.

**Placeholders.** None: every step carries the literal code or the literal command.

**Type consistency.** `hashTeamId` (Task 3) is consumed with that exact name in Task 5. `CountdownState.progress` (Task 1) is read as `state.progress` in Task 2. `--pod-fill` / `--slab-fill` are set in Task 5's `PodiumBand` and read by Task 4's `.tv-pod-shaft` / `.tv-pod-slab` — these two must agree, and do. `--stroke-hair` is introduced in Task 5 Step 4 because Task 5 Step 3 is the first thing to use it. `--w-pod-total` (Task 4) is the strip's figure column in Task 5. `podiumTeams` keeps its name and signature, so the existing `describe('podiumTeams')` block needs no change.
