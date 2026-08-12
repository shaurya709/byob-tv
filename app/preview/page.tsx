'use client'

import { WallHeader } from '@/components/WallHeader'
import { WeeklyGrid } from '@/components/WeeklyGrid'
import { openWeek } from '@/lib/feed'
import { competingTeams, rankByWeek } from '@/lib/ranking'
import { hashTeamId } from '@/lib/seed'
import { useWallData, type BoardSpec } from '@/lib/useWallData'
import { WATCH_RANKS_WEEKLY } from '@/config'
import type { Team } from '@/lib/types'

/**
 * **A preview. Not the wall.**
 *
 * `/weekly` is the board that ships and this route does not touch it. It renders
 * the same `WeeklyGrid`, from the same data, with one extra class on the frame —
 * `.tv-preview` — which is the only hook the green treatment's CSS answers to.
 * Nothing here can leak onto `/weekly` or `/podium`, because neither carries it.
 *
 * Reusing the real grid rather than mocking a few cards is deliberate: a preview
 * built from its own markup drifts from the thing it is previewing on the first
 * change to either, and is then worse than no preview at all.
 *
 * Delete this directory and the `.tv-preview` block in `app/mesa-tv.css`
 * together when the question is settled.
 */
const BOARD: BoardSpec = {
  name: 'weekly-preview',
  rank: (teams) => rankByWeek(competingTeams(teams)),
  earned: (team) => team.weekRevenue,
  watchTo: WATCH_RANKS_WEEKLY,
}

/**
 * An avalanche step over `hashTeamId`, for the demo figures below.
 *
 * **`lib/seed.ts` says not to take a small modulo of that hash, and it is
 * right.** All forty ids are `SLE-C4` plus two digits, and the accumulator's
 * multiplier is 31, so consecutive teams land ~31 apart — `hash % 9200` gave
 * forty "random" figures spanning ₹4,627 to ₹4,750, which made the whole
 * above-or-below-average colour split meaningless because every team sat within
 * ₹60 of the mean. This is the mixing step that file says such a modulo needs.
 */
function avalanche(n: number): number {
  let x = n
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d)
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b)
  x ^= x >>> 16
  return x >>> 0
}

/**
 * Fabricated today figures, for this route only.
 *
 * **The live feed publishes zero today revenue for all forty teams**, so the
 * figure and its colour rule cannot be judged from real data — there is nothing
 * to look at. These are invented so the treatment can be seen.
 *
 * Seeded from the team id, so the board is identical on every reload and two
 * screenshots taken minutes apart can actually be compared. The spread is wide
 * enough to put teams clearly on both sides of the mean, which is the whole
 * point of the colour split below.
 *
 * Nothing outside this file can reach this function, and `/weekly` renders the
 * real zeroes.
 */
function withDemoToday(teams: readonly Team[]): Team[] {
  return teams.map((team) => ({
    ...team,
    todayRevenue: 400 + (avalanche(hashTeamId(team.teamId)) % 11_600),
  }))
}

/** The cohort's average today, over the teams that have traded today. */
function meanToday(teams: readonly Team[]): number {
  const traded = teams.filter((t) => t.todayRevenue > 0)
  if (traded.length === 0) return 0
  return traded.reduce((sum, t) => sum + t.todayRevenue, 0) / traded.length
}

export default function PreviewPage() {
  const { snapshot } = useWallData(BOARD)
  const week = snapshot === null ? null : openWeek(snapshot.cohort)
  const teams = withDemoToday(competingTeams(snapshot?.teams ?? []))
  const mean = meanToday(teams)

  return (
    <main
      className="tv-frame tv-preview"
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        padding: 'var(--s-10) var(--s-12)',
      }}
    >
      <WallHeader snapshot={snapshot} label={week === null ? undefined : `BYOB Week ${week}`} />
      <WeeklyGrid
        teams={teams}
        todayToneOf={(team) =>
          team.todayRevenue === 0 ? undefined : team.todayRevenue >= mean ? 'up' : 'down'
        }
      />
    </main>
  )
}
