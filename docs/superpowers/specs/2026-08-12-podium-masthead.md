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

**Each metal is a ramp, not a flat fill**, and a flat fill is exactly why the
first version read as yellow, grey and orange — which is what a single hex *is*.
What makes a surface look metallic is a gradient from a shaded edge through the
body to a specular highlight, plus a sheen that travels. Both extra steps are
mixes against `--midnight-charcoal` and `--white`, so the exemption still covers
exactly three literals.

**Three, down from six.** Each metal also carried a dark ink for the numeral in
its badge; when the badges became numerals that break the card's edge, those
three had nothing left to colour and were deleted. A token nobody reads is a
literal this file claims an exemption for and does not use.

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

**Four families, and that needs saying out loud.** Two is what guarantees two TVs
set the same frame identically; this wall now carries four. Each addition is
scoped to one job — Archivo Black to the `BYOB` wordmark, Bebas Neue to venture
names — and both are bundled rather than linked, so the risk is 18KB of bundle
rather than a CDN that might not answer. A fifth should be argued for rather than
assumed.

**Venture names are Bebas Neue at weight 400.** The face has one weight, and
asking for 800 makes the browser synthesise a bold by smearing the outlines,
which on a condensed face closes the counters and turns a name into a block at
six metres. The sizes are raised about a fifth because Bebas is condensed and its
cap is a large share of its em — that puts the cap back where the sans had it,
and the width it gives back is what lets a long venture name fit its row.

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

## 5b. The rank numerals break the card's edge

One glyph per card, split by the card's top edge: 30% above it on the white page
in Deep Teal, 70% inside it in white. Drawn twice and each copy clipped to its
own side, which is the only way to give one glyph two colours along a curve.

**The split is on cap height and it is exact, not approximate.** `text-box:
trim-both cap alphabetic` trims the element's box to the cap itself — measured on
this face, a 200px numeral trims to 137.6px, a ratio of 0.688 that agrees with
the canvas metric to three places. Splitting on font size instead puts the cut
about a fifth of an em too low, because a line box is not a glyph. Measured on
the running board: 30.0% above on all three cards, with the two copies aligned to
0.0px.

The copies are separated by **paint order**, not by clipping: the Deep Teal copy
is drawn whole and the card is painted over it, so what survives is exactly the
part outside, following the corner radius for free. A rectangular clip was the
first version and it only worked while the numeral broke one edge — on a corner
it breaks two, and the region beside the arc belonged to neither clip and took a
notch out of the glyph.

**Measured clearances.** First place hangs 2.5px left of its own card; second and
third sit 3.3px *inside* theirs and clear the card to their left by 35.9px at
1920 and 29.9px at 1600. The short cards are pulled in further than first place
because their card has a neighbour 33px away, and a numeral hanging into that gap
starts to read as belonging to the card it is nearer.

**The discs had to move.** Second place's numeral cut 6px into its own mark
before the head room grew; head room and disc diameter are one budget, so taking
the room without giving any back only moves the collision. The short cards' disc
came down to 8.6vw in the same change. Clearances now measure 16.6 / 14.1 /
9.6px.

Without `text-box` support the whole numeral stays inside the card rather than
splitting in the wrong place — a worse design, but not a broken one.

## 5b2. The list is a row with a bar under it, not a filled pill

**Two shapes per team, chosen over one.** A single pill that was both the row and
the bar shipped for a day and was rejected on looking at the two side by side: a
pill tall enough to hold a 48px mark is a weak bar, and at 70px of height the
fill reads as a tinted row rather than as a measured length. Splitting them lets
the row be whatever height the mark needs and lets the bar be as thin as a bar
wants to be.

The cost is one more piece of furniture per team on a board whose design argument
has otherwise been to remove it. It is paid because the chart is the reason the
list exists — the figures are already written out beside it, so a bar that cannot
be read as a bar is decoration.

Every row now carries its venture's mark. That is what forced the rest of the
board to give height back: a row holding a 48px disc cannot be 57px tall, and
seven of them is 100px the cards had to find.

## 5c. The list bar measures the gap above it

Each bar is that team's revenue as a share of **the team immediately above it**,
not of any board-wide maximum. Two earlier versions measured against rank 1 and
then against the list's own leader, and both had the same defect: whoever led the
list drew a full bar and looked finished. Rank 4 is not finished — it is ₹466
behind third place, the tightest gap on the board.

The row above rank 4 is third place, on its podium card, which is why the
component takes the whole ranked list rather than the slice it draws. A full bar
is now impossible by construction: you cannot be 100% of the venture ahead of you
without being ahead of them.

## 5d. The sheen

A highlight travels left to right across each plinth and each filled bar, once
every seven seconds, resting off-screen for most of the cycle.

**A transform, not an animated `background-position`.** Both look identical; only
one is compositor work, and ten elements repainting continuously for the weeks
this page stays open is main-thread cost on a laptop driving a TV. It needs its
own element rather than a pseudo on the plinth, because a `clip-path` on a
transformed element travels *with* the element and stops clipping anything.

**This spends the wall's rule that movement means something happened**, and it is
the third thing on the board to do so after the idle marks. It is slow, low in
contrast, and rests for most of its cycle, so it reads as a surface property
rather than as an event. If an overtake ever stops landing here, this is the
first thing to remove. `prefers-reduced-motion` hides it with `display: none`
rather than `animation: none` — a stopped sweep would freeze a bright band across
one side of every plinth.

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

**`BYOB` is 690px of a 1080 frame** — 64% of the spine's height — and the rule
below it carries **equal air on both sides**, one token used twice. A rule with
more air above than below reads as belonging to the countdown rather than as
dividing identity from stake. It also means the countdown's position is a
consequence of the wordmark's size rather than something set separately: growing
`BYOB` pushes everything under it down.

**What caps the wordmark is height, not width.** The widest letter fills about
81% of the band's usable width, and the binding constraint is the as-of stamp at
the foot — at 10.6vw the two came within 6.3px at 2000×1100, which is a collision
rather than a tight fit. Filling that last 19% needs either a shorter stack, a
`scaleX` that distorts the face, or a font with a width axis, and Archivo Black
has none. Slack now measures 40.5 / 21.6 / 20.7px at the three real viewports.

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
