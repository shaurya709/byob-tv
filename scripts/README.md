# Scripts

Two kinds of thing live here: a one-time asset pipeline, and a measurement
harness for the wall.

The harness exists because of the project's central rule, stated in `AGENTS.md`
and `docs/DESIGN.md` §9: **measure the running app, do not read the source.**
Every bug these scripts have caught rendered convincingly, passed typecheck,
lint and the full test suite, and would have run on a wall for weeks.

## Setup

The measurement scripts need a browser driver, which is deliberately **not** a
dependency of this project — the wall ships five runtime packages and nothing
here belongs in that surface.

```bash
npm i -D playwright-core          # once, on the machine doing the measuring
npm run dev                       # the scripts measure a running server
```

Chrome is found automatically: `CHROME_PATH` if set, otherwise Playwright's
browser cache, otherwise the system Google Chrome. `Pillow` is needed for the
two Python scripts (`python3 -m pip install Pillow`).

---

## `measure-fit.mjs` — does it still fit?

```bash
node scripts/measure-fit.mjs [url]
```

Renders the slide at four viewports and reports header clearance, bottom air,
row height, strip width, pillar gap and overflow count.

**Reach for it after changing any height, gap or type size.** This is the one
that catches what a single 1920×1080 check cannot.

The trap it exists for: the type and dimension tokens are `vw` and shrink with
the frame, but **the `--s-*` spacing scale is fixed px and does not**. Every
gap and padding holds its size while everything around it contracts, so a band
that merely *fits* at 1920 can overlap the header at 1600. Measured before this
was budgeted properly: **−15.8px of clearance at 1600×900**, on a layout that
looked perfect at 1920.

`clearance` must be positive at every size. Aim for ≥10px at the smallest size
you care about; under ~5px is a heading waiting to be overlapped by a font that
loads a step heavier.

## `measure-frame.mjs` — the full report for one slide

```bash
node scripts/measure-frame.mjs [url] [screenshot.png] [--reduce-motion]
node scripts/measure-frame.mjs http://localhost:3000/weekly weekly.png
```

Dumps JSON: viewport and scroll extent, every element leaving the frame, the
header and dial, pillar geometry and **resolved fill luminance**, idle timeline
names and durations, mark sizes, `.tv-pill` count, strip rows, and which font
faces actually loaded.

**Reach for it after any change to geometry, colour or motion.** It answers
what a DOM assertion cannot: did anything leave the frame, are the pillars
genuinely identical, did `color-mix()` resolve to three *distinct* greens, are
the three marks really on different idle timelines.

Two notes earned the hard way:

- It forces `deviceScaleFactor: 1`. A persistent browser profile can carry a
  scale factor from a previous session — one was serving a 5760×3240 viewport
  at DPR 0.33, which makes every `vw` token read three times too large and
  silently invalidates the whole report.
- Luminance parsing handles `color(srgb …)` as well as `rgb(…)`, because
  `color-mix()` resolves to the former in Chrome. A parser that only knew
  `rgb()` reported 0.0001 for a mid-green and made a correct ramp look broken.

## `logo-legibility.py` — how small can a mark go?

```bash
python3 scripts/logo-legibility.py [out.png]
```

Renders every prepared logo in a circle at 40 / 48 / 64 / 81 / 100px.

**Reach for it when mark sizes change or new logos arrive.** It settles the one
question reasoning does not: at what diameter does a logo stop being a logo?

First run put the threshold near 50px — below it the wordmarks stop resolving
into anything. The strip's mark went 40px → 48px on that evidence. Remember
that *recognisable* is the bar, not *readable*: the venture name is printed
beside every mark, and at six metres a 48px mark subtends about 14 arcminutes —
enough for colour and silhouette, not for a word.

A logo faint at *every* size is an artwork problem, not a framing one.

## `prepare-logos.py` — the asset pipeline

```bash
python3 scripts/prepare-logos.py
```

Squares every source logo in `public/assets/Team Logos/` onto its own
background colour and writes `public/logos/<TEAM_ID>.png` at 512×512, so a
circular frame can be *filled* rather than the artwork cropped. Re-run it when
the source folder changes and paste its output into `LOGOS` in `config.ts`.

## `dev-feed.mjs`, `dev-churn.mjs`

Local fixtures for development. Not part of the verification harness.

---

# Open items

Three things are unresolved and will not surface on their own.

### 1. The team-number → workbook-ID mapping is unverified

Source logos are named `Team 17`, not `SLE-C417`. `prepare-logos.py` assumes
the obvious reading — team *N* is workbook `SLE-C4NN` — and **nothing has
confirmed it.** It could not be checked against the mock feed, which carries
invented venture names.

Confirm against `Team Links` before the wall goes live. Putting the wrong
venture's mark on a public wall is worse than showing no mark at all, and the
initial-square fallback is a first-class treatment. It is one function to
change.

### 2. `SLE-C412` is too pale to read at any size

Pale grey type on a white background *in the source artwork*. It is faint at
100px, so no framing, sizing or background choice downstream will fix it. It
needs redrawing by the team, or that venture will show an effectively blank
disc on the wall.

### 3. Podium venture names: serif or sans — unanswered

The design system is explicit that display and headings are `--font-serif`
while body and UI are `--font-sans`, and the slide headings now follow it. The
podium's **venture names** are currently sans. The pre-rewrite design had them
in serif, and they are the most display-like text on the frame after the
heading.

Both readings are defensible and the question was raised but never answered.
Decide it before the next typography pass, or the two boards will drift.
