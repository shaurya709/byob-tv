import { ColumnHeading, LOGO, VenturePill, type KickCue } from '@/components/VenturePill'
import { FACEOFF_GAP_PX, KNOCK_PX, timelineFor, type KickTimeline } from '@/lib/kickTimeline'
import { rankByWeek } from '@/lib/ranking'
import type { OvertakeEvent, Team, TeamId } from '@/lib/types'

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

function Column({
  teams,
  startRank,
  kick,
  timeline,
  onSettled,
}: {
  teams: readonly Team[]
  startRank: number
  kick: OvertakeEvent | null
  timeline: KickTimeline | null
  onSettled?: () => void
}) {
  // An empty column carries no heading. Labelling columns that have nothing
  // under them is apparatus describing absence.
  if (teams.length === 0) return <div />
  return (
    <div style={{ display: 'grid', gridAutoRows: 'var(--h-row)', alignContent: 'start' }}>
      <ColumnHeading />
      {teams.map((team, index) => (
        <VenturePill
          key={team.teamId}
          team={team}
          rank={startRank + index}
          cue={cueOf(kick, timeline, team.teamId, startRank + index)}
          onSettled={onSettled}
        />
      ))}
    </div>
  )
}

/**
 * The choreography, in one place. The board reads the event and hands each row
 * its instruction; no row ever computes its own.
 *
 * ── What moves, and by how much ──
 *
 * Beat B: the attacker rides one diagonal from its own slot straight to the
 * squared-off position — one logo width and a gap to the defender's left, at
 * the defender's y, so the vertical travel is the full **Δ rows**. The rows
 * strictly between the contestants each slide down one on the same window,
 * closing behind it. There is no vertical-only stop under the defender.
 *
 * Beat C: the boot. It is the attacker's alone.
 *
 * Beat D: the defender is knocked a short shove sideways, then falls into the
 * row the attacker vacated, while the attacker takes the defender's slot. Both
 * end exactly on the grid positions the held snapshot assigns them, so the
 * settle changes nothing visible.
 *
 * Horizontal reach is in pixels — the constants are pixel constants — and
 * vertical in row heights, which only the actor can convert, because only the
 * actor measured its row.
 *
 * Rows are identified by their rank *as rendered*, which is the held snapshot's
 * order for the whole kick: the freeze in `useWallData` is what makes these
 * ranks stable from the event's own frame of reference.
 */
export function cueOf(
  kick: OvertakeEvent | null,
  timeline: KickTimeline | null,
  teamId: TeamId,
  rank: number,
): KickCue | undefined {
  if (kick === null || timeline === null) return undefined
  if (teamId === kick.attacker) {
    return {
      role: 'attacker',
      // The diagonal's vertical half: all the way to the defender's row.
      rows: kick.toRank - kick.fromRank,
      timeline,
      boot: true,
      // Its horizontal half: logo centres one logo width plus the daylight apart.
      faceoffXPx: -(LOGO + FACEOFF_GAP_PX),
    }
  }
  if (teamId === kick.defender) {
    return {
      role: 'defender',
      rows: 0,
      timeline,
      knock: { xPx: KNOCK_PX, yRows: 0 },
      fall: { xPx: 0, yRows: 1 },
    }
  }
  if (rank > kick.toRank && rank < kick.fromRank) return { rows: 1, timeline }
  return undefined
}

export function WeeklyLeaderboard({
  teams,
  kick = null,
  onSettled,
}: {
  teams: readonly Team[]
  /** The kick in progress, so the two rows involved know to clear their details. */
  kick?: OvertakeEvent | null
  /** Passed to the rows; the attacker's reports the end of the sequence. */
  onSettled?: () => void
}) {
  const [left, right] = columnsOf(teams)
  // One clock per kick, derived from the climb size, shared by every cued row.
  const timeline = kick === null ? null : timelineFor(kick.fromRank - kick.toRank)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 'var(--s-16)',
        height: '100%',
      }}
    >
      <Column teams={left} startRank={1} kick={kick} timeline={timeline} onSettled={onSettled} />
      <Column
        teams={right}
        startRank={COLUMN_LENGTH + 1}
        kick={kick}
        timeline={timeline}
        onSettled={onSettled}
      />
    </div>
  )
}
