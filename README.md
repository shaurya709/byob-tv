# BYOB Campus TV Wall

Two pages that run on TVs across Mesa campus during BYOB Cohort 2026: a live
leaderboard and a Mesa Flea countdown with achievement notifications.

- `/podium` — top three across the frame, ranks 4–10 below, and the overtake
  sequence when rank 1 changes hands.
- `/countdown` — the Mesa Flea countdown, milestone takeovers, ambient sub-cards
  and the microsecond ticker.

**This is a display system, not a dashboard.** Nobody interacts with it. It runs
unattended for weeks, refreshes itself, survives network blips, and never asks
for a login. There is no backend, no auth and no database — just a static site
fetching two public CSVs.

The design and the reasoning behind every decision are in
[`docs/DESIGN.md`](docs/DESIGN.md). Read that before changing behaviour.

## Setup

```bash
npm install
npm run dev        # http://localhost:3000/podium
```

The wall will render an empty structure and log a fetch error until the two CSV
URLs are set — see below. Empty is a valid state; it never shows a spinner.

```bash
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
npm run lint
npm run build
```

## Connecting the data

The wall reads two tabs published out of the `BYOB_MASTER` Google Sheet as CSV.
[`docs/SHEET_SETUP.md`](docs/SHEET_SETUP.md) has the formulas to paste and a
verification checklist.

Once both tabs are published, paste their URLs into `config.ts`:

```ts
export const FEED_CSV_URL: string = 'https://docs.google.com/.../pub?gid=...&output=csv'
export const COHORT_CSV_URL: string = 'https://docs.google.com/.../pub?gid=...&output=csv'
```

They live in committed config rather than environment variables on purpose: they
carry no secret, and a fresh clone or a new Vercel project then just works
instead of deploying a wall that renders perfectly and fetches nothing.

The wall polls every 60 seconds. Google caches a published CSV for about five
minutes and the consolidator writes every ten, so a change reaches the screen
within roughly six minutes.

## Adding a venture logo

Two steps, in one commit:

1. Drop a **256×256 PNG with a transparent background** at
   `public/logos/<TEAM_ID>.png` — for example `public/logos/SLE-C407.png`.
2. Add that team ID to `LOGOS` in `config.ts`.

```ts
export const LOGOS: readonly TeamId[] = ['SLE-C407', 'SLE-C412']
```

The list is what tells the wall a logo exists, so a broken image is never
requested and there is no error-handler flash. A team not in the list gets a
coloured square with its venture's initial — **currently every team**, since no
logos exist yet, so that treatment is carrying the whole wall.

The client renders whatever it is given. A logo that is the wrong shape or has a
white box behind it will look worse than one that follows the spec.

## Changing the Mesa Flea date

One line in `config.ts`:

```ts
export const FLEA_DATE = new Date('2026-09-06T10:00:00+05:30')
```

Every countdown state — Calm, Aware, Urgent, Final hour, Past — derives from it,
as does the "Doors open at…" copy. Keep the `+05:30` offset: storing an absolute
instant is why the countdown is correct on a laptop set to any timezone.

**The 10:00 opening time is assumed, not confirmed.** That is recorded as a
comment in `config.ts` and deliberately never shown on screen.

## How it behaves inside the slideshow

Something else drives the rotation between these pages and the other Mesa
slides; this project contains no rotation logic and no way to switch between the
two pages.

Each page is self-sufficient. On becoming visible it fetches immediately,
reconciles against localStorage to work out what has happened since it was last
on screen, plays anything queued, and settles into its 60-second loop.

**Only a visible page fetches or reconciles.** That one rule makes the wall
correct whether the rotation reloads each URL or keeps both open as tabs — in
the tab case, a hidden page cannot double-fire triggers or clobber the store.

A page shown for the first time, or one whose localStorage has been cleared,
**records everything as already seen and animates nothing.** A TV plugged in
during week five behaves exactly like one that has been running since day one.

## Deployment

A static Vercel site. No environment variables, no serverless functions, no
build secrets. Point a Vercel project at the repo and deploy; the two routes
prerender as static content.

To reset a wall, clear its browser localStorage and reload — it will re-seed from
the sheet and go quiet until something new happens.

## Verifying a change

Unit tests cover the trigger engine and the playback machine, which are pure
functions and where the correctness actually lives. They do not cover layout.

**Layout and colour are verified by measuring the running app at 1920×1080**, not
by reading the source. Three of the bugs found during this build rendered
convincingly and passed typecheck, lint and tests — including a leaderboard row
that overflowed the frame and put rank 10 entirely off-screen with `overflow:
hidden` hiding any sign of it.

A useful check, run in the browser console on either page:

```js
[...document.querySelectorAll('main *')]
  .map(el => ({ el, r: el.getBoundingClientRect() }))
  .filter(({ r }) => r.width > 0 && (r.right > innerWidth + 0.5 || r.left < -0.5))
  .map(({ el }) => el.textContent.trim().slice(0, 30))
```

Anything it returns has escaped the frame and is invisible on the wall.

When fixing a bug with a test, reintroduce the bug first and confirm the test
fails. Every load-bearing test in this repo was verified that way.
