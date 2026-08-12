# `/podium` — three floating cards, then seven ranked bars

**Date:** 12 August 2026
**Status:** implemented
**Supersedes:** `docs/superpowers/specs/2026-08-12-podium-pillars-design.md` in full

---

## 1. Why

The pillars were correct and measured, and they still read wrong. Three heavy
green blocks with small marks perched on them are *furniture with logos on it* —
and the venture, which is the only thing on this slide anyone actually cares
about, ended up the smallest element in its own column.

The brief was explicit: scratch the podium, show the top three as floating cards
of their logo, and make ranks 4–10 read as rows.

Two references were supplied and they are references, not templates:

- **A winners' announcement.** Three cards, the centre one larger and
  overhanging the others top and bottom, a rank medal overlapping a top corner,
  a name band under the image. The cards hover *above* the podium blocks rather
  than standing on them, which is the whole idea worth taking.
- **A tournament leaderboard.** Each rank is one horizontal bar built from
  separate blocks: rank at the left in its own tab, the body carrying the mark
  and the name, the score in its own block at the right.

What was taken: the size step, the overhanging medal, the bar split into blocks,
the rank sitting *beside* the row rather than inside it. What was not: the
podium bases under the cards (explicitly scratched), the confetti and foliage,
the gold-versus-white first-place bar (first place is a card here, so there is no
row to accent), and both palettes.

## 2. The three cards

A green card, the venture's mark floating on it under a white ring, its name and
its total underneath, and the rank as a medal pinned over the top-left corner.

**Rank is said three times: card size, the depth of the green, and the medal.**
Deliberately redundant. A photograph of the wall taken at an angle loses the
medal; a greyscale reproduction loses the ramp; either one still ranks. This is
the one argument that carries over from the pillars unchanged — it was made
there for height, colour and numeral.

**Centred, not standing on a floor.** The pillars aligned on their bases because
a podium has ground under it. These do not: first place is larger in both
directions and overhangs second and third top *and* bottom. That overhang is
what makes the group read as floating rather than as three objects on an
invisible shelf.

**The card is wider than the mark needs.** The widest thing in it is the venture
name, not the disc — "The Pitlane Collective" wants about 250px at
`--t-tv-pod-name` — so a card sized to the disc alone would have to clip it.

**The medal is top-left**, where `/weekly`'s rank numerals also sit. The
reference puts it top-right. The wall already has an answer to "where does rank
live", and two answers on two slides that rotate minutes apart is worse than
either one on its own.

**The white ring is budgeted, not added.** It is drawn *outside* the mark's box,
so it lands on whatever is under it; the mark shrinks by twice the ring rather
than the card growing by it. `/weekly`'s green preview learned this by merging a
disc into its own base. Without the ring a dark logo on a dark card loses its
edge entirely, and the fallback initial discs — tinted from a set that includes
deep teal — disappear outright.

### The ramp

`--pod-1` / `--pod-2` / `--pod-3`: Deep Forest Green, then 28% and 50% of
`--green-600` mixed into it. Measured luminance 0.041 / 0.090 / 0.144.

**Every step carries white type, and that is what caps the mix.** The pillars
could afford `--bright-green` at third place because a filled shape with a
numeral on it has no text-contrast floor; a card with a name *and* a figure does.
At 50% the figure measures 3.6:1 and the name 5.4:1. At 55% the figure hits
3.0:1 — the AA-large floor exactly, with no margin for a TV's own gamma.

The figure is `--tangerine-200`, not `--tangerine-600`. It was gold on white and
has to stay gold on green; the deeper step is what fails the ratio above.

**`--bright-green`'s podium exemption is withdrawn.** Nothing on this wall sets
it any more.

## 3. Ranks 4–10

A green tab carrying the rank, daylight, then a mint bar carrying the mark, the
name and the figure in its own white block.

**Quiet on purpose.** The three cards are the story. Seven bars in a strong fill
would flatten that back out — the same reason the pillars' strip refused
`.tv-pill`, and the same failure: borrowing the other board's language here made
slide 1 look like a shorter slide 2.

The daylight between the tab and the bar is what stops the pair closing up into
one pill. The bars carry `--shadow-sm` against the cards' `--shadow-lg`, so they
float one step less; without it seven mint rectangles sit flat on a white page
while the three things above them hover, and the slide reads as two unrelated
treatments rather than one board.

## 4. Motion

Unchanged from the pillars. The three marks idle on `tv-idle-1/2/3`, **assigned
by place and not by team** — three ids into three buckets collide about one time
in nine even with a good hash, and `lib/seed.ts` documents a worse failure on top
of that. The bars do not move at all.

`perspective` sits on the mark's **direct parent**. It applies to an element's
own children and nothing deeper, so the version of this that put it on the row
of cards left the idle's glance rendering as a flat horizontal squash — the mark
being crushed rather than turning to look at something.

This still spends the wall's rule that movement means something happened. Same
deal as before: the idle is slow and small where an overtake is fast, large and
directional. If the overtake ever stops landing once both are on screen, the
idle is what gives.

## 5. The vertical budget

1000px of content box at 1920×1080, 65.3px of header, so the board gets 934.7px.
The four bands sum to ~855px, which leaves ~40px of slack — half above and half
below, because the board is centred.

**The medal spends part of that before the card does.** It hangs about a third of
its own diameter above the card's top edge, so the clearance that matters is the
card's less the overhang. Measured on the first pass: a card sitting a
comfortable 26.1px under the header put its medal **3.9px** under it.
`scripts/measure-fit.mjs` now measures `.tv-pod-medal` for exactly this reason —
the same class of failure as the `.tv-card` selector that reported 207.5px of
clearance on `/weekly` by measuring the wrong edge.

The `--s-*` scale is fixed px and does not shrink with the `vw` sizes, so **the
tightest frame is 1600×900, not the smallest one**. Measured: 24.5 / 15.6 / 9.7 /
53.9px of clearance across the four viewports, overflow 0 at each.

## 6. What ranks 4–10 do *not* get

No pagination, no scrolling, no rotation — there are exactly seven of them and
they all fit. Rank 11 is off the board entirely: this is a top ten, not a
leaderboard that trails off.

## 7. Still open

The overtake flip does not run on this board yet. `/weekly` has it; `/podium`
watches rank 1 only (`WATCH_RANKS_PODIUM`) and currently does nothing when it
changes. When it is wired, the flip has to answer a question the grid never had
to: an overtake here swaps two cards of **different sizes**, and the winner's
card grows while the loser's shrinks. The grid's `scale` cue already carries the
row-to-row ratio, so the mechanism exists — what has not been decided is whether
the medals travel with the cards or stay put, and rank is a fact about the board
rather than about the venture, which argues they stay.
