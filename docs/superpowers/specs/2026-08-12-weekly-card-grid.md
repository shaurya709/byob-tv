# `/weekly` — a 4 × 10 card grid, and cards that flip

**Date:** 12 August 2026
**Status:** approved, decisions closed, implementation started
**Supersedes:** the two-column 40-row list and the boot-kick overtake animation on
`/weekly` (`docs/DESIGN.md` §8, and the row/kick architecture in `components/VenturePill.tsx`).
Both are removed entirely.

---

## 1. Layout

**40 cards in a 4 × 10 grid.** Ten cards per row, ranked left to right, then top to
bottom — rank 1 at the top-left of row 1, rank 40 at the bottom-right of row 4.

**Forty cards, always, all visible.** Not paged, not scrolled, not rotated. This is
carried over from the list it replaces and is **not** negotiable when the frame gets
tight: a team that has to wait for its turn on screen effectively is not on the wall,
and forty teams each glancing at it for four seconds is the entire point. 4 × 10
affords it on one 1920 × 1080 frame. **If a future fit problem appears, it is solved by
taking height out of the ramp, never by paging.**

**Card width is constant across all 40 cards.** Every row spans the full content width
and holds ten cards, so width is fixed by the viewport and the gap, not by rank.

**Row heights descend from row 1 to row 4.** Cards within a row are identical to each
other; only the row-to-row height changes. Rows 2, 3 and 4 step down progressively.

The exact ramp is a visual decision and must be found by looking, not derived. The four
row heights are four named constants in one place so they can be adjusted in isolation
without touching layout code.

### The frame's actual budget

Measured from the running app at 1920 × 1080 rather than computed from tokens:

| | |
|---|---|
| `main.tv-frame` content box | **1824 × 1000** (padding `--s-10` / `--s-12` = 40 / 48) |
| Header (`--h-header`, 3.4vw) | **65.27px** |
| Left for the grid | **934.73px** |
| Card width at a 12px gap | **171.6px** |
| Left for the four rows at a 12px gap | **898.73px** (average 224.7 each) |

### The bounds the ramp has to sit inside

**Row 4 sets the floor, and the floor is the greater of two constraints.**

1. *The text block.* The venture name and the revenue figures must be legible from
   three to five metres — roughly 24px minimum on the primary figure.
2. *The logo half.* Approximately 50px, the threshold established by
   `scripts/logo-legibility.py` and recorded in `Podium.tsx`.

> **Correction, 12 Aug 2026.** The first draft of this spec said logo legibility is
> "bounded by width and is therefore the same in every row", and instructed the builder
> to confirm the *rendered logo width* clears 50px. **That is wrong, and it is wrong in
> the dangerous direction.** A contained logo is `min(cardWidth, logoHalfHeight)`. At a
> 171.6px card and rows averaging 224.7px, the logo half is roughly 100px — so **height
> governs, and logo size does vary down the rows.** Checking the width would pass
> trivially (171.6 ≫ 50) while row 4's logo sat at 48px: a check that always succeeds,
> on a wall that would then run for weeks with an illegible bottom row. Measure the
> logo's rendered **height**.

Both floors land near 125–135px, so neither dominates and both must be checked.

**The viewport sets the ceiling.** Four row heights plus three gaps plus the header must
fit 1080px with no page scroll.

**Row 1 does not need to be large.** With row 4 at its floor, rows 1–3 still divide
roughly 769px — an average of 256px each. There is abundant room, so resist making the
top row bigger than the ramp requires. The space is better spent keeping row 4
comfortable.

**The `--s-*` trap applies to this grid.** The type and dimension tokens are `vw` and
shrink with the frame; the `--s-*` spacing scale is fixed px and does not. Three
row gaps and the card padding hold their size while everything around them contracts.
Run `scripts/measure-fit.mjs`, which exists for exactly this — a layout that merely fits
at 1920 has been measured at −15.8px of clearance at 1600 × 900.

---

## 2. Card anatomy

**A base carrying the team's details, with the venture's mark floating above it as a
disc.** There is no logo panel: the card *is* the base, and the mark hovers over it on the
page's own white, lifted by a shadow rather than by distance.

> **Superseded, 12 Aug 2026.** The mark previously sat inside a Deep Forest Green panel
> filling the card's top half. Removing it also settled a defect the panel had created:
> two of `VentureLogo`'s six identity tints are Deep Forest Green and Deep Teal — the
> panel's own colour and its neighbour — so four teams without artwork (`SLE-C411` Moh,
> `SLE-C417` Postcards, `SLE-C435`, and `SLE-C432` Lowkey Livin on the teal) had discs
> that could not be seen against it, and needed a mint hairline to have any edge at all.
> On white every tint reads, and the hairline went with the panel that required it.

**The source logos are circles**, masked to discs with transparent corners by
`scripts/prepare-logos.py`, so `VentureLogo` draws a disc for artwork and initial alike.

**Each disc has two faces.** The front is the venture's mark; the back is the Mesa lockup
on `var(--deep-forest-green)`. Nothing turns them over yet — the flip is the next slice —
but the back is built now because it is what makes the disc an *object*, and because
`backface-visibility: hidden` needs two faces to work against. Without it the flip would
have shown every mark mirrored.

The full lockup rather than the abstract brand mark: compared side by side at true disc
size, `brand-mark-solid` reads as an unidentifiable white blob and both concentric
variants are a soft glow or rings too fine to survive six metres.

**The shadow is a `box-shadow` on the faces, never a `filter` on the disc.** A `filter` of
any kind forces the used value of `transform-style` to `flat`, which silently destroys the
3D context — measured: with a `drop-shadow`, rotating a disc 180° showed its own front
mirrored instead of the Mesa back.

**Bottom half: the venture name and both revenue figures.**

**Both figures are kept — this week and today.** The list this replaces showed two
numbers per team, and `HOT_TODAY_MIN` (₹5,000) drives the board's single emphasis rule.
Both survive the redesign. Week revenue is the larger figure — it is the number the
board exists to show — with today's beneath it, carrying the hot emphasis when it
crosses the threshold.

**Today's figure is labelled; the week's is not.** The list this replaces put "This week"
and "Today" above the two figure columns. A card has nowhere to put column headings, so two
bare rupee amounts would leave a passer-by no way to tell which is which. A small `TODAY`
tag rides the figure itself, and appears **only when there is a figure** — a permanent
caption over an empty line is apparatus describing absence, and it would be describing it
on all forty cards on a quiet morning.

**If the bottom half is tight, the space comes out of the logo half, never out of a
figure.** This is what makes the text block a *fixed* height, identical in all forty
cards, with the logo half absorbing the entire row-to-row variance. One consequence
worth stating: the name and both figures are the same type size on every card, top row
to bottom, so forty cards read as one system and only the logos change scale.

**Rank badge: top-left corner of the card**, overlaying the logo half.

### Naming fallback — decided

An unnamed team shows **its Team ID** (`SLE-C4xx`) in the name position. It is identity,
not a missing field, and the card should say who the card belongs to.

Placeholder text (`Type your venture name`, `Name 1, Name 2…`) is treated as absent, not
as a name — `UNNAMED_VENTURE` in `config.ts` and `ventureNameOf` in `lib/feed.ts` already
do this, and that logic is unchanged.

### Long names — decided

**A marquee, not truncation.** Show what fits; after a pause, scroll the remainder in a
loop.

- **Never break mid-word.** The visible portion must always end at a word boundary.
- **Only names that actually overflow animate.** A name that fits sits still. Most will.
- **Slow loop, long pause.** This is a wall people glance at, not read.
- Card heights never vary within a row to accommodate text.

`prefers-reduced-motion: reduce` shows the first word-aligned page, static.

---

## 2a. The row-1 look

**Row 1 only.** The other thirty cards hold still, and that is what marks the top row out
as the live one. An idle everywhere would be wallpaper, and it would spend the wall's
"movement means something happened" rule forty times over instead of ten.

Built from `/podium`'s repertoire — bob, glance, tilt — plus one move the podium does not
have: **the look down**, a `rotateX` that drops the mark's face toward the figure beneath
it.

**The budget is 70% down, 30% side, and it is counted rather than estimated.** Each of the
three timelines spends 28% of its cycle in a down pose and 12% in a side pose; the rest is
at rest or bobbing. Change one hold and the ratio moves, so the percentages in
`app/mesa-tv.css` are the specification, not decoration.

Three timelines at three durations (17s / 19s / 23s), assigned **by column** with a 2.3s
phase step. Not by team-ID hash: a hash is right for a tint, which must follow a venture
wherever it goes, and wrong here, because ten marks side by side must differ from *each
other* and a hash cheerfully gives three neighbours the same answer. `/podium` assigns by
place for the same reason.

**`perspective` belongs on the disc's direct parent.** It applies only to an element's own
children, so one level further up it does nothing and the look-down renders
orthographically — a flat squash rather than a face tipping forward. Measured while it sat
on the cell: the disc's height was exactly `cos(30°)` of its width, which is the signature
of no perspective at all.

`prefers-reduced-motion: reduce` stops it entirely.

## 3. Overtake animation

The boot-kick sequence is removed entirely, along with its shared timeline, its
per-kick geometry, and its cross-column suppression logic.

**The replacement: cards flip, travel, and unflip.** When the order changes:

1. The affected card flips to its back, and **its base is absorbed upward into the
   disc** — not faded where it stands. The disc reads as having picked the card's
   contents up rather than as having outlived them.
2. Face-down, it travels to its new position, resizing on the way if the destination
   is in a row of a different height.
3. It unflips at the destination, face-up in its new place, and the base slides back
   down out of the disc and reappears.

**The base travels too, while it is invisible.** Both halves are separately positioned —
the mark is centred in the space above the base, the base is pinned to the cell's bottom
edge — so they move by *different* vertical amounts between rows of different heights, and
the cue carries both. Measured with only the mark travelling: rank 5 arrived showing
Snapper's mark above CHAKHANA's figures, a card split in two.

**Sliding cards travel in full view.** A card merely making room never turns over, so both
its halves simply move on the same window the contestants cross on.

**The card back is Deep Forest green carrying the Mesa logo** — `var(--deep-forest-green)`,
the existing token, not a new value.

### Why the travel matters

A flip in place does not communicate an overtake. Two cards blinking is only legible to
someone who already knew the previous order. The movement between positions is what makes
it read as one team passing another, so the flip and the travel must be sequenced rather
than simultaneous.

### Stagger

The card that gained rank flips first; the card that lost flips a beat later — roughly
150ms. This reads as cause and effect rather than a simultaneous blink. Tune the offset
by watching it, not by reasoning about it.

### Cross-row overtakes — decided: they animate

A team moving from rank 11 to rank 10 crosses from row 2 to row 1, and the two rows have
different heights, so the card changes size mid-travel. **The size change is part of the
travel**, not a jump at either end.

**Everything between the two contestants drops one place as well, without flipping.** A
climb of one rank is the pure exchange this design describes and there is nothing in
between; a climb of seven moves six other cards, and they are not part of the contest.
They slide with their faces up, so the two that turn over stay the only story on screen.

`columnLength` and its cross-column suppression are deleted, along with its
`overtake.test.ts` cases. The suppression existed because the kick rendered as vertical
slides *inside one column* and a cross-column climb had no line to travel
(`lib/overtake.ts:81–97`). A face-down card has no such constraint. That same check also
silently retired boundary defenders; under 4 × 10 nothing falls off the board — all forty
are on one frame — so the retirement has nothing left to do.

### Every team's card flips — decided

Named or not. `AGENTS.md` claimed "a team with an empty `venture_name` never fires a
trigger"; the detection path never enforced it, and the behaviour is the one we want.
The doc is corrected to match rather than the code changed to obey it.

### The geometry is read once, before anything moves

`WeeklyGrid` takes one layout measurement per flip, when the event arrives and never while
anything is animating, and the cues are pure numbers from then on.

**Untransformed layout only.** Row 1's marks are permanently mid-idle, so
`getBoundingClientRect` on one returns a bobbing, rotating box and deltas computed from it
would differ on every frame. Cells never move, and `offsetTop` / `offsetHeight` ignore
transforms, so together they describe where a mark *would* be at rest — which is where it
has to travel to.

### The idle is suspended for the duration of a flip

The two would otherwise fight for the same `transform`, and a CSS animation beats an inline
style — so the idle would simply win and the card would never turn over. It is also the
right call visually: the flip is the event, where the idle is only weather.

### Reduced motion

`prefers-reduced-motion` is honoured throughout: no flip, no travel, final positions
rendered immediately.

### `WATCH_RANKS_WEEKLY` — 20, with a new justification

The old reason ("the weekly board watches its whole first column") dies with the columns.
The number survives because **ranks 1–20 are exactly the top two rows** of a 4 × 10 grid —
still a clean visual unit, and the two tallest rows under a descending ramp.

The mechanical argument for a limit is genuinely gone: a flip is card-local, where the
kick needed an unbroken vertical line inside one column. What remains is attention, and
attention cannot be settled by reasoning. Holding the number at 20 while the layout
changes means that when the wall is judged too busy or too quiet, the ramp and the flip
are what is being judged — not a watch depth moved at the same time.

Against **40**: the bottom rows churn hardest, since a team on ₹4,000 flips three ranks
on one ₹200 sale, and with `KICK_QUEUE_CAP = 4` drained one at a time the queue would sit
saturated with low-stakes movement while a rank 4→3 waited behind it. Against **10**: it
makes three-quarters of the board inert, which is *less* coverage than today.

Then measure it — count events per hour at 20 against live data for a day. It is a
one-constant change if the answer is 40.

---

## 4. Constraints carried over

Already established in the repo, and applying unchanged.

- **Measure the running app.** Every serious bug in this project rendered plausibly and
  was quietly wrong. Verify geometry, luminance and timing against the browser, not the
  source. The harness in `scripts/` exists for this.
- **The `--s-*` fixed-px trap** — recorded in `app/mesa-tv.css`, and see §1 above.
- **The MesaSerif family collision** — recorded in `app/layout.tsx`.
- **The `hash % 3` collapse** — recorded in `lib/seed.ts`.
- **Logo legibility threshold ~50px** — recorded in `Podium.tsx`. Bounded by **height**
  in this layout; see the correction in §1.
- **Never hardcode a hex.** Only `colors_and_type.css` may contain one.
- **Empty is a valid state, and no spinners, ever.**
- **Unresolved:** the team-number to workbook-ID mapping is unverified, and `SLE-C412`'s
  artwork is too pale to read at any size. Both are in `scripts/README.md`.

### `--h-row` is not shared with `/podium`

The pillars spec §3.5 intended `/podium`'s strip to share `--h-row` with `/weekly`. **The
implementation rejected that on measured evidence** and `app/mesa-tv.css` records why:
inheriting the forty-row height left the top ten cramped, so the strip runs on its own
`--h-pod-row: 3.0vw` against `--h-row`'s 2.3vw.

So `--h-row` is weekly-only and dies with the two-column list, touching nothing on
`/podium`. The two boards are held together by screenshotting both at 1920, not by a
shared token. The pillars spec has been corrected.

---

## 5. Build approach

Build the grid with the four row heights as adjustable constants, render against live
data, and screenshot at the display's actual resolution. Then look, adjust, and repeat.
Two or three rounds should settle the ramp.

Do not pick ratios and defend them — the ramp is a visual judgement and the user makes it.
