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
 * Beat B: the attacker rides up to **one row below the defender** — `(Δ − 1)`
 * rows, not Δ — and the rows strictly between the contestants each slide down
 * one, closing behind it. For Δ=1 the attacker is already adjacent and B moves
 * nothing.
 *
 * Beat C: the attacker slides diagonally out of the stack — one logo width and
 * a gap to the defender's left, one row up to the defender's y — to square off.
 * The boot is the attacker's alone.
 *
 * Beat D: the defender is knocked a short shove sideways, then falls into the
 * row the attacker vacated, while the attacker takes the defender's slot. Both
 * end exactly on the grid positions the held snapshot assigns them, so the
 * settle changes nothing visible.
 *
 * Every offset is relative to the row's own slot (defender) or Beat B's end
 * (attacker): x in pixels — the constants are pixel constants — and y in row
 * heights, which only the actor can convert, because only the actor measured
 * its row.
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
      // Beat B ends one row below the defender: `toRank + 1`, so travel is Δ − 1.
      rows: kick.toRank + 1 - kick.fromRank,
      timeline,
      boot: true,
      // Logo centres one logo width plus the daylight apart, at the defender's y.
      faceoffOffset: { xPx: -(LOGO + FACEOFF_GAP_PX), yRows: -1 },
      // The swap ends in the defender's old slot: back to column x, same y.
      slotSwapDestination: { xPx: 0, yRows: -1 },
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
