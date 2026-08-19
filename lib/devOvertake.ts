'use client'

import { useCallback, useMemo, useState } from 'react'

import type { Team, TeamId } from '@/lib/types'

/**
 * Development only: makes a triggered overtake change the board, not just
 * animate over it.
 *
 * ── The bug this exists for ──
 *
 * `DevFlipTrigger` enqueues an event, and an event is only half of an overtake.
 * The other half is the data moving, which is what the real pipeline gets from
 * the sheet — so a triggered flip played the whole choreography and then settled
 * onto a board that had re-sorted to *exactly the order it started in*. The
 * marks crossed, the details faded out, and the same details faded back in on
 * the same cards. Measured: rank 20 read `Aara ₹7,030` before the trigger and
 * `Aara ₹7,030` after it, with the details correctly returning to opacity 1 the
 * whole time. Nothing was wrong with the animation; there was nothing for it to
 * arrive at.
 *
 * So the trigger records what the climb *would* have done to the figures, and
 * this applies it — **at the settle, never at the click**. Applying it when the
 * button is pressed would re-sort the board underneath cards that are already
 * mid-flight, which is the exact race `freeze`/`thaw` exists to prevent for real
 * snapshots.
 *
 * ── Why it lives here and not in the trigger ──
 *
 * `DevFlipTrigger` is stripped from production builds entirely, and the page
 * importing a hook out of it would have kept the whole module — controls
 * included — in the bundle. This is a separate module so that the component
 * stays independently strippable: what ships to production from here is a hook
 * that returns its argument.
 */

const DEV = process.env.NODE_ENV === 'development'

/** Queued by the trigger on click, drained by the board on settle. */
let pending: { teamId: TeamId; challengeRevenue: number }[] = []

/**
 * What the climb is worth, in revenue.
 *
 * Halfway between the team being passed and the one above it where there is
 * room, and one rupee above the defender where there is not — so the attacker
 * lands strictly between them and the sort has an unambiguous answer rather than
 * a tie broken by units or team id.
 */
export function devQueueClimb(attacker: Team, defender: Team, above: Team | undefined): void {
  if (!DEV) return
  const ceiling = above?.challengeRevenue ?? defender.challengeRevenue + 2
  const gap = ceiling - defender.challengeRevenue
  const challengeRevenue =
    gap > 2 ? defender.challengeRevenue + Math.floor(gap / 2) : defender.challengeRevenue + 1
  pending.push({ teamId: attacker.teamId, challengeRevenue })
}

export function useDevOvertakes(teams: readonly Team[]): {
  teams: readonly Team[]
  commit: () => void
  reset: () => void
} {
  const [applied, setApplied] = useState<ReadonlyMap<TeamId, number>>(() => new Map())

  // Drained in the same commit the kick settles in, so the re-sort and the
  // cards' reset to their resting transforms land together — the board is never
  // seen reordering under a mark that has already arrived.
  const commit = useCallback(() => {
    if (!DEV || pending.length === 0) return
    const taken = pending
    pending = []
    setApplied((prev) => {
      const next = new Map(prev)
      for (const p of taken) next.set(p.teamId, p.challengeRevenue)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    pending = []
    setApplied(new Map())
  }, [])

  const adjusted = useMemo(() => {
    if (!DEV || applied.size === 0) return teams
    return teams.map((t) => {
      const figure = applied.get(t.teamId)
      return figure === undefined ? t : { ...t, challengeRevenue: figure }
    })
  }, [teams, applied])

  return { teams: adjusted, commit, reset }
}
