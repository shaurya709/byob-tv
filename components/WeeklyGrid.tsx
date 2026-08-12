import { VentureCard } from '@/components/VentureCard'
import { rankByWeek } from '@/lib/ranking'
import type { Team } from '@/lib/types'

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
 * The four row heights, in the order they are laid out. The values are in
 * `app/mesa-tv.css` and are a visual judgement; this list only says that there
 * are four of them and which is which.
 */
const ROW_HEIGHTS = [
  'var(--h-card-1)',
  'var(--h-card-2)',
  'var(--h-card-3)',
  'var(--h-card-4)',
] as const

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

/** Ranks 1–40 in four rows of ten. Short boards simply produce shorter rows. */
export function rowsOf(teams: readonly Team[]): Team[][] {
  const ranked = rankByWeek(teams)
  return ROW_HEIGHTS.map((_, i) => ranked.slice(i * ROW_LENGTH, (i + 1) * ROW_LENGTH))
}

export function WeeklyGrid({ teams }: { teams: readonly Team[] }) {
  const rows = rowsOf(teams)

  return (
    <div
      style={{
        display: 'grid',
        // Stated heights rather than `1fr` each: the ramp is the design, and
        // `1fr` would quietly redistribute it the moment a row was short — a
        // board with thirty teams would grow row 4 to match row 1 and the
        // hierarchy would vanish exactly when the wall was least populated.
        gridTemplateRows: ROW_HEIGHTS.join(' '),
        gap: 'var(--s-card-gap)',
        height: '100%',
        alignContent: 'center',
      }}
    >
      {rows.map((row, i) => (
        <div
          key={ROW_HEIGHTS[i]}
          // `.tv-card-row` turns the height below into `--d-card-logo`. That
          // derivation has to happen *here*, on the element that actually has a
          // `--h-card`, not in `:root` — see the note on the class.
          className="tv-card-row"
          style={{
            // The row publishes its own height to the cards inside it, which is
            // what lets `--d-card-logo` resolve per row without any card
            // knowing its rank. One declaration, four values, no branching.
            ['--h-card' as string]: ROW_HEIGHTS[i],
            display: 'grid',
            gridTemplateColumns: `repeat(${ROW_LENGTH}, minmax(0, 1fr))`,
            gap: 'var(--s-card-gap)',
            minHeight: 0,
          }}
        >
          {row.map((team, j) => (
            <VentureCard
              key={team.teamId}
              team={team}
              rank={i * ROW_LENGTH + j + 1}
              {...(i === 0 ? { idle: LOOK_TIMELINES[j % LOOK_TIMELINES.length], delaySeconds: j * PHASE_STEP_S } : {})}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
