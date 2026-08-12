# `/podium` — a masthead spine, three cards on plinths, seven pills

**Date:** 12 August 2026
**Status:** implemented
**Supersedes:** `docs/superpowers/specs/2026-08-12-podium-cards.md` in full, and
the pillars spec before it

---

## 1. What this is

Built from an approved design image plus a written build spec. Where the two
disagreed the image won, except in three places recorded in §6 where the image
was showing an unsolved problem rather than an intention.

The slide has three zones: a full-height masthead at the left, one tall card and
two short ones, and ranks 4–10 as pill bars filling the well beneath the short
pair.

**The asymmetry is the ranking.** First place is the only venture given a column
to itself, and it does not have to be labelled as first for that to read.

## 2. Geometry is transcribed, not invented

Every number was measured off the approved image (2760 × 1572) and converted.
The horizontal figures are `vw` and sum to 99.9:

```
spine 12.5 | gutter 3.5 | card 1 34.5 | gap 1.7 | card 2 21.1 | gap 1.7 | card 3 21.1 | edge 3.8
```

**The vertical is `fr`, and that is not a stylistic choice.** The first pass
sized it in `vw` like the rest of the wall and it overflows off-ratio: the
content came to 55.4vw of height, and a 2000 × 1100 frame has only 55.0vw of
height to give. `vw` heights are safe when they are a small share of the frame
and fatal when they are most of it. So first place takes 84% of the board's
content height at every aspect rather than 815px at one of them.

Measured: clearance 86.4 / 90.0 / 72.0 / 115.2px and **overflow 0** at
1920×1080, 2000×1100, 1600×900 and 2560×1440.

## 3. The metals — one documented exemption

`app/mesa-tv.css` says no new hues and AGENTS.md says only the design-system file
may hold a hex. Gold, silver and bronze are three new hues **and** three
literals, so the file's own header was amended to record the exemption, its
scope, and that it is not a precedent. They encode first, second and third and
nothing else.

**Deriving them was tried on paper and rejected on measurement.** Gold sits at
hue 39° and the tangerine tokens at 31°, so gold is nearly derivable; deriving
both gold and bronze from one token pulls them *together*, and the distance
between them is the whole problem a three-metal system has. Silver at 208° has
no brand relative — the palette contains no cool grey.

**Bronze is not the specified `#B07542`.** That value measured 11° from gold,
2.8° from `--tangerine-600` — close enough to read as the brand tangerine rather
than as a metal — and its numeral cleared only 3.89:1. Pushing it redder alone
makes contrast *worse*, because red is darker; it is pushed redder **and
lighter**. `#CD6237` is 22° from gold, 13.6° from the brand tangerine, and its
numeral clears 4.51:1.

## 4. Type: two registers, and a face that cannot reach the mock

Figures are the heaviest weight the face has, tracked in. Names are the same
weight, uppercase, tracked out. Tight numbers beside open names is what produces
the competitive feel, and removing either half collapses the effect.

**`--font-sans` tops out at 800.** That is the entire `wght` axis of
MesaBody-Variable, not an understated `@font-face`. The approved design was drawn
in Arial Black — a 900, and an unusually heavy one. Measured at matched cap
height, Manrope 800 carries **80% of its ink** and sets 8% narrower. The two
levers that recover some of that without a second font family are size and the
negative tracking, and both are spent.

**`BYOB` is set in Archivo Black**, a third family added by decision after the
first build and scoped to that one word. It is *bundled* — a 9.8KB latin woff2 in
`app/fonts/` with its OFL licence — never linked: a `fonts.googleapis.com`
request is a runtime network dependency on a wall that runs unattended for weeks,
and a font that fails to load silently falls back to Helvetica on a screen nobody
is watching closely enough to notice.

Single weight, and that is the point: Archivo Black *is* the 900, so there is no
axis and nothing can render it lighter by accident. It replaced MesaSerif at 900,
which was the heaviest thing this wall could previously draw. A side effect worth
knowing: nothing on `/podium` uses the serif any more, and the browser confirms
it — `mesaSerifVariable` reports `unloaded` on this slide.

## 5. The countdown: one brain, two presentations

The masthead bands at 7 days, 3 days and 24 hours and shows whole weeks above the
first; the shared header's dial still bands at 15 days and 24 hours. Both read
the same `computeCountdownState`, which is where every comparison against the
clock happens. `mastheadCountdown` reads the figures it publishes and decides
which to show. **`/weekly` is unchanged.**

The final band deliberately reuses `TIMER_UNDER_MS` rather than declaring its own
24 hours — the two boards must not disagree about when the last day starts.

**Weeks round to nearest, and the spec's stated reason for that is wrong.**
"Never understates the time remaining" is what `ceil` does; nearest rounds 24
days *down* to 3 weeks and understates by three. Nearest is implemented because
it is what the approved image renders — 25 days as "4 WEEKS TO GO". Changing it
to `ceil` is one word, and there is a test pinning the behaviour either way.

## 6. Where the image lost

The image is the target, and it won everywhere except three places where it was
displaying a defect its own risk list asks to prevent:

- **Rank 10's name runs through its figure.** Prevented structurally: the figure
  has its own grid track, so no name can reach it. Measured on the live cohort,
  "ATC (All Things Camphor)" — the exact name that collides in the image — sets
  399px of ink in a 522px track and clears by 123px, so the ellipsis guard never
  fires. It stays because a venture can be renamed from a spreadsheet on any
  Tuesday.
- **Card 3's wordmark spills past its white circle.** Every mark is contained.
- **The spec's 4.5% masthead.** 86px cannot hold stacked `BYOB` at any weight.
  The image
  measures 12.5% and the image wins; the spec's own author agreed.

Two further deviations, both deliberate and both small:

- **The list is aligned to the cards above it**, not inset by the image's 39px. A
  39px inset with nothing depending on it reads as a mistake rather than a
  decision, and aligning them makes the right-hand block read as one column.
- **The short cards' disc is 9.8vw, not the image's 10.1vw.** At 10.1 it leaves
  itself 1px in a short card at 2000×1100 and spills over its own venture name.

## 7. The spine's furniture, and what it lost

**The lockup leads the spine.** It began in the colophon at the foot and was
moved to the head, which is where every other Mesa surface puts it and where the
eye enters a left-hand band; everything below slid down behind it.

The as-of stamp closes the spine, because the wall shows no error state by design
— a failed fetch keeps the last good data and goes on rendering perfectly healthy
stale numbers for days, and this stamp is the only thing that makes that visible.

**"Total revenue" was here and has been removed**, by decision. It was the one
line telling a passer-by that these figures are all-time where `/weekly`'s are
the week's, and the two slides rotate on one screen minutes apart — so the
ambiguity it covered is now uncovered. Recorded rather than argued: if a figure
is ever misread between the two boards, this is the line that went.

## 8. Contrast, measured off the running page

Every text-on-fill pairing clears its WCAG floor. The two tightest:

| Pairing | Ratio | Floor |
|---|---|---|
| Bronze badge numeral | 4.51:1 | 3 |
| Pill rank on fill | 5.94:1 | 3 |

The pill rank is a deeper mix than the specified `#5F7B75`, which measured
3.34:1 — AA-large with nothing spare.

**The measurement script had to be fixed before it could be believed.**
`color-mix()` computes to `color(srgb 0.12 0.37 0.28)` with 0–1 channels, while a
plain token computes to `rgb(17, 64, 59)` with 0–255. Dividing both by 255
reported every mixed colour as near-black and failed seven pairings that were
fine. A contrast check that reports exactly `1:1` is measuring its own parser.

## 9. Still open

- **Gold against bronze at distance.** They are now 22° apart rather than 11°,
  but bronze reads as copper rather than as the browner metal in the image. This
  is a judgement to make on the wall, not on a laptop.
- **Silver is the only cool colour on the frame.** It reads as silver rather than
  as foreign, but the same caveat applies.
- **The overtake flip does not run on this board.** `/weekly` has it; `/podium`
  watches rank 1 only and currently does nothing when it changes. Wiring it here
  has to answer a question the grid never had: an overtake swaps two cards of
  different sizes *and different metals*, and a card that carried its gold across
  the frame would be claiming the metal belongs to the venture rather than to the
  place.
