# `/podium` — pillars, a green ramp, and a progress dial

**Date:** 12 August 2026
**Status:** approved in brainstorm, not yet implemented
**Supersedes:** the podium described in `docs/DESIGN.md` §8 ("1st centred and larger, 2nd left,
3rd right, ranks 4–10 in a strip below", on `panel-forest` and frosted glass, rank written in words)

---

## 1. Why

The podium shipped in `fb434cb` is correct and measured, and it still does not work. The
verdict from the person who has to look at it: *"it doesn't look nice — the aesthetics, colour
schemes. The pills were for the weekly dashboard. The space utilisation is not up to the mark.
The Mesa Flea calendar illustration looks weird."*

Three of those are real design faults, not taste:

- **The pills are borrowed.** `.tv-pill` is `/weekly`'s language — forty rows that close around
  their own logo during a kick. Reusing it on `/podium` was defended as consistency, but it makes
  slide 1 look like a shorter slide 2 rather than a different board.
- **The tiles float.** Three rounded rectangles with nothing underneath them read as cards, not
  as a podium. Rank was carried by height, colour and size all at once, and none of them landed
  because the objects had no relationship to each other.
- **The calendar is drawn at the wrong size.** It is a 52×40 SVG page with two binding rings,
  rendered ~44px tall on a 1920 frame. At that size the rings are not a calendar, they are speckle.

Underneath all three was a vision that had not been asked for yet: *three pillars, with the teams'
logos standing on top of them, dancing, and everyone else listed below.*

## 2. What was decided

Eight decisions, each made against rendered mockups rather than description. The mockups are kept
in `.superpowers/brainstorm/56968-1786513219/content/` (gitignored) — `pillar-geometry.html`,
`motion-dancing.html`, `idle-repertoire.html`, `palette.html`, `night-corrected.html`,
`white-pillars.html`, `green-ramp.html`, `calendar.html`, `ring-modes.html`.

| # | Question | Decision |
|---|---|---|
| 1 | Podium geometry | **Separated columns.** Three architectural pillars with a capital and a base, standing apart. The logo stands on the capital. |
| 2 | Motion | **Perpetual idle**, not event-only. |
| 3 | Idle character | **Mixed repertoire** — bob, glance left, glance right, double-take, tilt — not uniform bobbing. |
| 4 | Idle intensity | **Playful** — 16px bob, 34° turn, 9° tilt. |
| 5 | Field | **Pure white.** |
| 6 | Pillar colour | **Green ramp**: 1st deepest, 3rd lightest, 2nd genuinely between — a real green family, *not* a desaturation. |
| 7 | Pillar heights | **All three identical.** Rank is carried by colour, logo size and numeral, never by height. |
| 8 | Flea countdown | **Progress ring, pure dial** — the ring never holds text; the figure always sits beside it. Applies to **both** slides. |

## 3. The design

### 3.1 Frame

Unchanged from today: 1920×1080, `padding: var(--s-10) var(--s-12)`, `WallHeader` in the top band
at `--h-header` (3.4vw), no scroll. `/podium`'s heading stays `"BYOB Top 10"`; `/weekly`'s stays
the sheet's open week. The header component is already shared and already takes the heading as a
prop — no change there beyond the dial.

Two bands below the header, centred in the remaining height so the resting margin falls out of the
layout rather than being padded in:

```
┌─ header ───────────────────────────────────── 65px ─┐
│ Mesa mark    BYOB TOP 10    ◔ 25 days · Updated ##  │
├─ podium band ──────────────────────────────  ~512px ┤
│         ●            ●            ●                 │   logos, idling
│       ═════        ═════        ═════               │   capitals
│       ║ 2 ║        ║ 1 ║        ║ 3 ║               │   shafts, equal height
│       ═════        ═════        ═════               │   bases
│      Lemon…      Quartzy      Verdant…              │
│     ₹2,39,999   ₹2,49,647    ₹2,33,368              │   gold
├─ gap ────────────────────────────────────────  40px ┤
├─ strip ────────────────────────────────────── 338px ┤
│                                  TOTAL REVENUE      │
│  4  ● Indigo Loom                     ₹2,30,192     │   black
│  … hairline rules, no pills …                       │
│ 10  ● Bluejay Bags                    ₹1,98,316     │
└─────────────────────────────────────────────────────┘
```

### 3.2 The pillars

Three pods, **identical in every dimension**. Order left to right is 2 · 1 · 3.

Each pod, top to bottom: **logo** → **capital slab** → **shaft** (carrying the rank numeral at its
top) → **base slab** → **venture name** → **total revenue**.

The three pods align on the **capital line**, not on their logo tops. First place's logo is larger,
so the logo occupies a fixed-height row with the logo bottom-aligned inside it — that keeps all
three capitals, shafts, names and figures on one line while still letting the winner's mark be
bigger. This is the whole content of decision 7.

Slabs overhang the shaft on both sides, which is what makes it read as a column rather than a bar.

Target geometry at 1920 (**verify by measurement, tune if cramped** — these are intentions, not
contracts):

| Token | Target @1920 |
|---|---|
| `--w-pod` | 380px |
| `--w-pod-shaft` | 220px |
| `--w-pod-slab` | 248px (overhangs the shaft) |
| `--h-pod-shaft` | 230px |
| `--h-pod-slab` | 14px |
| `--s-pod-gap` | 90px |
| `--d-pod-logo-1` | 132px |
| `--d-pod-logo-2` | 104px |
| podium extent | 3 × 380 + 2 × 90 = **1320px** |

The strip below is set to the same 1320px extent so ranks 4–10 sit under the pillars as a
continuation, exactly as they do today.

### 3.3 The colour ramp

Deepest at first place, lightest at third. **Two of the three are existing brand tokens outright**;
the middle is derived from two of them, so no hex is hardcoded and no hue is invented — the
`AGENTS.md` rule holds.

| Rank | Shaft | Source |
|---|---|---|
| 1 | `#11403B` | `var(--deep-forest-green)` |
| 2 | `≈#308557` | `color-mix(in srgb, var(--green-600) 62%, var(--deep-forest-green))` |
| 3 | `#6ED190` | `var(--bright-green)` |

The middle swatch approved in the mockup was `#2E8A55`, which does not sit exactly on the line
between the two tokens — no single mix ratio reproduces it. 62% is the closest fit, landing within
about 5/255 per channel (it is a touch less saturated in green). That residual is invisible at six
metres and is worth paying to keep the ramp derived from tokens instead of hardcoding a hex, which
`AGENTS.md` forbids outright. If the rendered pillar reads as too dull beside pod 3, raise the ratio
toward 68% rather than introducing a literal.

**Each slab is the next darker step of the same ramp** — 3rd's slab is 2nd's green, 2nd's slab is
1st's green, 1st's slab is `--deep-teal`. A slab is therefore always "this pod, in shadow", and
never gold. This replaces the tangerine capitals from the first draft, which made the slabs read as
a separate decorative system.

**The numeral flips with the pod.** Light (`--soft-mint`) on pod 1; dark (`--deep-teal`) on pods 2
and 3. This is not an ad-hoc rule — it is exactly what `VentureLogo` already does with its
`LIGHT_TINTS` set, and the implementation should follow that precedent rather than invent a second one.

**Revenue colour:**

- Top three: gold, `var(--tangerine-600)` `#CB853C`.
- Ranks 4–10: black, `var(--midnight-charcoal)`.

Note that gold here is Tangerine 600 and *not* Tangerine Glow. `app/mesa-tv.css` already documents
why: Glow measures ~1.9:1 on white. The brief said "gold"; on this surface Tangerine 600 is what
gold means.

### 3.4 Idle motion

Each logo runs one of **three timelines** — `idle1`, `idle2`, `idle3` — built from a shared
repertoire: bob, glance left, glance right, double-take, tilt. The glance is a `rotateY` on the disc
under a container `perspective`, so the mark turns its *face* rather than sliding sideways. That is
what makes it read as looking at something.

Durations are **17s / 19s / 23s** — different durations, not merely different delays, so the three
never fall into step and the pattern does not visibly repeat.

Which timeline and which phase offset a venture gets is **seeded from its team ID**, using the same
hash `VentureLogo.tintFor` already uses. A venture therefore always idles the same way, exactly as
it always gets the same tint. The hash should be lifted out of `VentureLogo` and shared rather than
copied.

Intensity (playful): `--idle-amp: 16`, `--idle-turn: 34`, `--idle-tilt: 9`, consumed inside the
keyframes via `calc()` so one set of keyframes serves any intensity.

**These are CSS keyframes, not Motion.** `app/mesa-tv.css` already sets this precedent for
`tv-breathe`, with the reasoning spelled out: an animation that runs forever, unrelated to any state
change, must not occupy the JS thread for the life of the page. The idle is that case in its purest
form — it runs for weeks. The comment above `tv-breathe` currently claims it is "the only animation
defined in CSS rather than in Motion" and will need updating.

`prefers-reduced-motion: reduce` disables the idle entirely.

### 3.5 Ranks 4–10

Seven rows. **No `.tv-pill`** — that is `/weekly`'s language and the reason this strip currently
looks like a borrowed component. Rows are separated by a hairline rule (`var(--border)`), with no
fill and no container.

Row height stays `--h-row` (44.16px), shared with `/weekly`, and the mark stays 30px. That is the
right kind of consistency: the *scale* matches so the two boards feel like one wall, while the
*decoration* differs so they read as two different boards.

> **Superseded on implementation, 12 Aug 2026.** The sharing was tried and rejected on measured
> evidence. Inheriting the forty-row height left the top ten looking like an afterthought squeezed
> under the podium — cramped type, no air, a third of the frame empty — so the strip runs on its own
> `--h-pod-row: 3.0vw` and the podium above was shrunk to pay for it. The reasoning is recorded at
> `app/mesa-tv.css`. `/weekly` has since become a 4 × 10 card grid with four row heights and no
> `--h-row` at all, so there is no longer a row on `/weekly` for this one to match. The two boards
> are held together by screenshotting both at 1920, not by a shared token. See
> `docs/superpowers/specs/2026-08-12-weekly-card-grid.md` §4.

Columns, left to right: rank (`--midnight-charcoal`) · 30px logo · venture name, centred · total
revenue, right-aligned, black. A right-aligned `TOTAL REVENUE` caption sits above the figure column
and renders only when there is at least one row under it.

### 3.6 The Flea dial — both slides

`FleaStrip` is rendered inside `WallHeader`, which both slides use, so this is one component change
that lands on `/podium` and `/weekly` together. That was explicitly asked for.

The calendar page SVG — rounded rect, binding strip, two rings, and the `wide` variant that exists
solely so timer mode fits — is **deleted** and replaced with a ring:

- Constant-diameter ring at `--h-tv-cal`, so the header band's height never changes.
- Track `var(--soft-mint)`; progress `var(--deep-forest-green)`; `var(--tangerine-600)` on the final
  day and during the event.
- **The ring never contains text.** The figure always sits beside it — `25 days`, `9d 4h`,
  `01:23:45`, `LIVE NOW`. Every mode has identical structure, so nothing relocates as the date
  approaches. This is the whole point of choosing the pure dial over the hybrid: the wall crosses
  these thresholds at 3am with nobody watching, and a layout that rearranges itself at a threshold
  is a layout that can break unobserved.
- Label above, unchanged: `MESA FLEA`.
- Still renders nothing when the sheet has supplied no instant, and still disappears for good once
  the event is over.

**Progress is elapsed programme time**, not an arbitrary window:

```
progress = clamp01((now - PROGRAMME_START) / (fleaInstant - PROGRAMME_START))
```

`computeCountdownState` gains a `progress: number` field. It stays pure of the clock — `now` keeps
arriving as an argument.

## 4. Rules this design deliberately spends

Three, all flagged and accepted rather than discovered later.

**1. "Movement means something happened."** This is the wall's central rule (`AGENTS.md`,
`docs/DESIGN.md` §8) and the entire overtake-kick architecture rests on it. Perpetual idle motion
spends it. The decision was made with that trade stated. Mitigation: the idle is low-amplitude and
slow, while the kick is large, fast and directional, so the two remain distinguishable — but this is
a real cost, not a neutralised one. If the kick stops landing once both are on screen together, the
idle is what gives.

**2. `--bright-green` on a white surface.** `app/mesa-tv.css` carries an explicit note:
*"`--bright-green` is a dark-surface token. Do not use it on this wall."* Pod 3 uses it anyway. The
justification is that the ban is about **figures and text** set in bright green — the note's own
measurement, ~1.9:1, is a text-contrast number — whereas this is a large filled shape with a dark
numeral on it, which is a different problem. **The genuine risk is the pod's *edge* against white**,
which will be soft. This must be checked by eye at 1920 and from distance; if the pillar looks like
it is dissolving, the fix is a hairline in the slab colour, not a different green. The note in
`mesa-tv.css` must be amended either way, so the next person does not read it as an absolute.

**3. A third copy of the programme-start date.** The ring needs an anchor, and 20 July 2026 exists
today only in `AGENTS.md`, `docs/DESIGN.md` and two sheet cells (`docs/SHEET_SETUP.md` says
"written in exactly two cells"). There is no anchor constant in the code — `lib/schedule.ts` only
knows the IST hour, and the Flea instant comes from the sheet. A `PROGRAMME_START_ISO` constant in
`config.ts` is therefore a new third copy. It carries a comment pointing at `docs/SHEET_SETUP.md`,
and the alternative — publishing it as a cohort key — is deliberately deferred because it changes
the sheet contract for one decorative arc.

## 5. Files

| File | Change |
|---|---|
| `components/Podium.tsx` | Rewrite. Pillars, ramp, idle, rule-separated strip. |
| `components/FleaStrip.tsx` | Replace `CalendarPage` with the ring. Delete the `wide` variant. |
| `components/VentureLogo.tsx` | Export the team-ID hash so idle assignment shares it. No visual change. |
| `lib/countdown.ts` | Add `progress` to `CountdownState`. |
| `config.ts` | Add `PROGRAMME_START_ISO`. |
| `app/mesa-tv.css` | Pod tokens, ramp, idle keyframes and intensity vars, strip rule; retire the podium tile classes; amend the `--bright-green` note and the `tv-breathe` "only animation" comment. |
| `app/podium/page.tsx` | No structural change expected. |
| `components/render.test.tsx` | Update podium assertions. |
| `lib/countdown.test.ts` | Progress cases. |

`app/weekly/page.tsx` and `components/WeeklyLeaderboard.tsx` are **not** modified. `/weekly` changes
only through the shared `FleaStrip`, which is the intended blast radius.

## 6. States that must hold

Unchanged in intent from today, and non-negotiable:

- **No feed yet** — header plus three empty pods holding their geometry, each showing `—`. No
  spinner, ever.
- **Nobody trading** — three pods, `—` for every figure. Never `₹0`: zero asserts a team traded and
  earned nothing, which before the cohort opens is false for all forty.
- **Fewer than three teams** — the missing pods still render, empty. A podium with second and third
  missing reads as a broken wall.
- **A name longer than the pod** — clipped with an ellipsis, never wrapped. A second line pushes the
  figure out of the pod, and the figure is why the pod exists.
- **Spares** — `SLE-C441` / `SLE-C442` filtered via `competingTeams`, in the board *and* in the
  `BoardSpec.rank` the overtake detector uses. Already fixed in `fb434cb`; must not regress.

## 7. Verification

Per `AGENTS.md`: **measure the running app at 1920×1080, do not read the source.**

1. No scroll, no clipping, no element outside the frame.
2. All three shafts identical in width and height; all three capitals on one y.
3. The three shaft fills resolve to three *distinct* colours, and 2 sits between 1 and 3 in
   lightness. Sample computed `background-color`, do not trust the `color-mix()` declaration.
4. Strip carries **no** `.tv-pill` — assert the class is absent from `/podium` — while row height and
   logo diameter still equal `/weekly`'s.
5. Indian grouping: `100000` → `₹1,00,000`.
6. Idle: three logos, three different `animation-duration`s, transform-only. Confirm the same team
   ID yields the same timeline across reloads.
7. `prefers-reduced-motion: reduce` stops the idle.
8. The dial's four modes at true header size, and the header band's height identical across all four
   and across both slides.
9. `/weekly` is unchanged except for the dial — diff its measurements against the values recorded in
   `fb434cb`'s report.
10. Pod 3's edge against white, judged from distance. See §4.2.
11. Data extremes from §6.
12. `npm run typecheck`, `npm run test`, `npx eslint`, `npm run build`.

## 8. Out of scope

The boot kick on `/podium`, the end-of-day state, the hero/notification cards, the rotation shell,
and any change to `/weekly`'s board itself. The idle must be built so the kick can land on top of it
later, but the kick is not this piece of work.
