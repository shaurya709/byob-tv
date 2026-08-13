'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import { VentureCard } from '@/components/VentureCard'
import { STAGGER, type FlipCue } from '@/lib/flipTimeline'
import { rankByWeek } from '@/lib/ranking'
import type { OvertakeEvent, Team } from '@/lib/types'

/**
 * Slide 2 — the whole competing cohort as forty cards, ranked on this week's
 * revenue.
 *
 * **Forty cards, always, all visible.** Not paged, not scrolled, not rotated: a
 * team that has to wait for its turn on screen effectively is not on the wall,
 * and forty teams each glancing at it for four seconds is the entire point. If
 * this stops fitting at some viewport, the height comes out of the ramp in
 * `app/mesa-tv.css` — paging is not the escape hatch.
 *
 * Ten per row, ranked left to right then top to bottom: rank 1 at the top-left
 * of row 1, rank 40 at the bottom-right of row 4. Reading order, so finding your
 * own card means scanning the way you already read.
 *
 * ── Rank is carried by the row's height, not by the card's width ──
 *
 * Every card is the same width — the grid gives each row ten equal columns — so
 * the only thing that changes down the board is how much vertical room a row
 * gets, and therefore how large its marks are. Cards within a row are identical
 * to each other.
 */

export const ROW_LENGTH = 10
export const ROWS = 4

/**
 * The three look timelines, and the phase step between neighbours.
 *
 * **Row 1 only.** The other thirty cards hold still, and that is what makes the
 * top row read as the live one — an idle everywhere would be wallpaper, and it
 * would also spend the wall's "movement means something happened" rule forty
 * times over rather than ten.
 *
 * Assigned by *column*, not by team id. The hash is right for a tint, which must
 * follow a venture wherever it goes, and wrong here: ten marks side by side have
 * to differ from **each other**, and a hash cheerfully gives three neighbours
 * the same answer. `/podium` assigns by place for exactly this reason, and
 * `lib/seed.ts` carries the warning.
 *
 * The phase step is what stops the three-timeline cycle from showing: with ten
 * marks and three timelines, columns 0, 3, 6 and 9 share a timeline, and without
 * an offset they would bob in unison across the row. 2.3s is deliberately not a
 * factor of any of the three durations.
 */
const LOOK_TIMELINES = ['tv-look-1', 'tv-look-2', 'tv-look-3'] as const
const PHASE_STEP_S = 2.3

/**
 * Four rows, one height.
 *
 * **The ramp is gone.** The four rows used to descend 13.6 -> 8.5vw so that rank
 * could be read off a card's size; every card now carries a rank badge or a
 * metal numeral, so the height was saying more faintly what the badge says
 * outright. The mark is also capped by the *card's width* well before row 1's
 * height ran out, so the extra 98px in row 1 had stopped becoming logo and
 * become dead green. See the note on `--h-card` in app/mesa-tv.css.
 *
 * The array survives because it is what says there are four rows, and because
 * `rowsOf` slices on its length.
 */
const ROW_HEIGHTS = [
  'var(--h-card)',
  'var(--h-card)',
  'var(--h-card)',
  'var(--h-card)',
] as const

/** Ranks 1–40 in four rows of ten. Short boards simply produce shorter rows. */
export function rowsOf(teams: readonly Team[]): Team[][] {
  const ranked = rankByWeek(teams)
  return ROW_HEIGHTS.map((_, i) => ranked.slice(i * ROW_LENGTH, (i + 1) * ROW_LENGTH))
}

/**
 * Where a rank's mark sits, and how big it is — in **untransformed layout**.
 *
 * Every value here is read from the box model rather than from a transformed
 * rectangle. That distinction is load-bearing: row 1's marks are permanently
 * mid-idle, so `getBoundingClientRect` on one returns a bobbing, rotating box
 * and the deltas computed from it would be different on every frame. The cell
 * never moves, and `offsetTop` / `offsetWidth` ignore transforms, so together
 * they describe where the mark *would* be at rest — which is where it has to
 * travel to.
 */
type Slot = { x: number; y: number }

function slotOf(grid: HTMLElement, rank: number): Slot | null {
  const cell = grid.querySelector<HTMLElement>(`[data-rank="${rank}"]`)
  if (cell === null || cell === undefined) return null
  const box = cell.getBoundingClientRect()
  return { x: box.left, y: box.top }
}

/**
 * The choreography, in one place. The grid reads the event and hands each card
 * its instruction; no card ever computes its own.
 *
 * ── What moves ──
 *
 * The attacker climbs from `fromRank` to `toRank` and flips. The card it
 * displaces — the defender, holding `toRank` — flips too, a beat later, and
 * drops one place.
 *
 * **Everything between them drops one place as well, without flipping.** A climb
 * of one rank is the pure exchange the design describes, and there is nothing in
 * between; a climb of seven moves six other cards, and they are not part of the
 * contest. They slide with their faces up, so the two that turn over stay the
 * only story on screen.
 *
 * A slide can still cross rows — rank 10 to rank 11 is the end of one row to the
 * start of the next — so every mover gets the same resize treatment. That is why
 * `scale` is on the shared cue rather than on the contestants' own.
 */
export function cuesFor(grid: HTMLElement, kick: OvertakeEvent): Map<number, FlipCue> {
  const cues = new Map<number, FlipCue>()
  const move = (from: number, to: number, role: FlipCue['role'], shift: number) => {
    const a = slotOf(grid, from)
    const b = slotOf(grid, to)
    // A slot the board does not currently render — the climb reached past the
    // bottom of a short board. Nothing to animate, and the data still re-sorts.
    if (a === null || b === null) return
    // **Cell corner to cell corner, and no scale.** Every cell is the same size
    // since the height ramp went, so a card crossing a row boundary needs no
    // resize on the way — which is what let the mark and its base become one
    // travelling object instead of two that had to be reassembled at the far
    // end. If a ramp ever comes back, this is the first thing that breaks.
    cues.set(from, { role, dx: b.x - a.x, dy: b.y - a.y, shift, toRank: to })
  }

  move(kick.fromRank, kick.toRank, 'attacker', 0)
  move(kick.toRank, kick.toRank + 1, 'defender', STAGGER)
  for (let rank = kick.toRank + 1; rank < kick.fromRank; rank += 1) {
    move(rank, rank + 1, 'slide', STAGGER)
  }
  return cues
}

export function WeeklyGrid({
  teams,
  kick = null,
  onSettled,
}: {
  teams: readonly Team[]
  /** The flip in progress, so the cards involved know what to do. */
  kick?: OvertakeEvent | null
  /** Called once, by the attacker's card, when the last beat finishes. */
  onSettled?: () => void
}) {
  const rows = rowsOf(teams)
  const gridRef = useRef<HTMLDivElement>(null)
  const [cues, setCues] = useState<Map<number, FlipCue> | null>(null)

  /**
   * One layout read per flip, taken **before** the flip starts and never during
   * it. The cues are pure numbers from then on, so no card touches the DOM while
   * anything is moving — the same discipline `VenturePill`'s resting measurement
   * followed, and for the same reason.
   */
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (kick === null || grid === null) {
      setCues(null)
      return
    }
    setCues(cuesFor(grid, kick))
  }, [kick])

  return (
    <div
      ref={gridRef}
      style={{
        display: 'grid',
        // Stated heights rather than `1fr` each: the ramp is the design, and
        // `1fr` would quietly redistribute it the moment a row was short — a
        // board with thirty teams would grow row 4 to match row 1 and the
        // hierarchy would vanish exactly when the wall was least populated.
        gridTemplateRows: ROW_HEIGHTS.join(' '),
        gap: 'var(--s-card-gap)',
        height: '100%',
        // **Headroom for the metal numerals over ranks 1-3, which break above
        // their cards' top edge and are painted outside row 1 entirely.**
        //
        // Padding rather than a taller row: the numerals overflow the cell, so
        // giving row 1 more height would only add air *inside* three cards and
        // leave the glyphs exactly as clipped as before. `--h-card-headroom` is
        // the numeral's cap height, not its font size — see the token.
        //
        // `start`, not `center`: centring splits the leftover height half above
        // and half below, so half of any gap opened here would be spent under
        // row 4 where nothing needs it.
        paddingTop: 'var(--h-card-headroom)',
        alignContent: 'start',
      }}
    >
      {rows.map((row, i) => (
        <div
          key={i}
          // **The row no longer publishes a `--h-card` of its own, and must not
          // start again.** It used to, because each row had a different height;
          // with one shared height the declaration became `--h-card:
          // var(--h-card)` on the row, which is a self-reference. CSS resolves a
          // cyclic custom property to *guaranteed-invalid*, so `--d-card-logo`
          // fell apart, `VentureDisc` computed `width: 0px`, and forty marks
          // vanished from a board that still rendered its cards, its badges and
          // all forty figures. Measured, not reasoned about.
          className="tv-card-row"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${ROW_LENGTH}, minmax(0, 1fr))`,
            gap: 'var(--s-card-gap)',
            minHeight: 0,
          }}
        >
          {row.map((team, j) => {
            const rank = i * ROW_LENGTH + j + 1
            const cue = cues?.get(rank)
            return (
              <VentureCard
                key={team.teamId}
                team={team}
                rank={rank}
                cue={cue}
                onSettled={cue?.role === 'attacker' ? onSettled : undefined}
                {...(i === 0
                  ? {
                      idle: LOOK_TIMELINES[j % LOOK_TIMELINES.length],
                      delaySeconds: j * PHASE_STEP_S,
                    }
                  : {})}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
