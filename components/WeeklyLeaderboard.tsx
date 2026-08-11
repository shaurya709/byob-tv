import { ColumnHeading, VenturePill } from '@/components/VenturePill'
import { rankByWeek } from '@/lib/ranking'
import type { Team } from '@/lib/types'

/**
 * Slide 2 — the whole competing cohort, ranked on this week's revenue.
 *
 * **Forty rows, always, all visible.** Not paged, not scrolled, not rotated: a
 * team that has to wait for its turn on screen effectively is not on the wall,
 * and forty teams each glancing at it for four seconds is the entire point.
 *
 * Two columns of twenty, filled **down then across** — ranks 1–20 on the left,
 * 21–40 on the right. Reading order, so finding your own row means scanning one
 * column rather than alternating between two.
 */

export const COLUMN_LENGTH = 20

export function columnsOf(teams: readonly Team[]): [Team[], Team[]] {
  const ranked = rankByWeek(teams)
  return [ranked.slice(0, COLUMN_LENGTH), ranked.slice(COLUMN_LENGTH, COLUMN_LENGTH * 2)]
}

function Column({ teams, startRank }: { teams: readonly Team[]; startRank: number }) {
  // An empty column carries no heading. Labelling columns that have nothing
  // under them is apparatus describing absence.
  if (teams.length === 0) return <div />
  return (
    <div style={{ display: 'grid', gridAutoRows: 'var(--h-row)', alignContent: 'start' }}>
      <ColumnHeading />
      {teams.map((team, index) => (
        <VenturePill key={team.teamId} team={team} rank={startRank + index} />
      ))}
    </div>
  )
}

export function WeeklyLeaderboard({ teams }: { teams: readonly Team[] }) {
  const [left, right] = columnsOf(teams)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 'var(--s-16)',
        height: '100%',
      }}
    >
      <Column teams={left} startRank={1} />
      <Column teams={right} startRank={COLUMN_LENGTH + 1} />
    </div>
  )
}
