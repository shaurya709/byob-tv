'use client'

import { rankByWeek } from '@/lib/ranking'
import { clearKicks, enqueueKicks } from '@/lib/storage'
import type { OvertakeEvent, Team } from '@/lib/types'

/**
 * Fire a boot kick on demand, in development only.
 *
 * An observability affordance, not a feature: the kick fires when a rank changes
 * hands, which on live data happens a few times a day, and watching it that way
 * is not a way to judge whether it reads.
 *
 * ── It is not a second code path ──
 *
 * The only thing this does that the detector does not is *construct* the event.
 * From there it goes through `enqueueKicks` — the same function, the same
 * localStorage queue, the same replace-by-id, the same cap — and is drained by
 * the same `takeKick` inside `useKick`, which remains the only reader of the
 * queue. `BootKick` is never invoked directly and `lib/overtake.ts` is not
 * involved at all. What you watch is what live data produces.
 *
 * The id uses the same `week:attacker:toRank` shape as a real event, so queue
 * behaviour under repeated clicks is identical to queue behaviour under
 * repeated detection rather than merely similar.
 *
 * ── Reset is not a fallback ──
 *
 * The third button exists so an animation that wedges can be cleared without a
 * page reload while the cause is being found. It is not a recovery path for the
 * wall: it renders only in development, nothing schedules it, and no production
 * code calls what it calls. A wedged kick in production is a bug to fix, not a
 * state to recover from.
 */

/** Deterministic pairs, so the same click always produces the same contest. */
const PAIRS: readonly (readonly [from: number, to: number])[] = [
  [8, 5],
  [12, 9],
  [16, 13],
]

function eventFor(ranked: readonly Team[], week: number | null, [from, to]: readonly [number, number]): OvertakeEvent {
  const attacker = ranked[from - 1]
  const defender = ranked[to - 1]
  // Throwing rather than picking something else: a trigger that quietly
  // substituted a different pair would have you judging an animation you did not
  // ask for, which is worse than a stack trace in development.
  if (attacker === undefined || defender === undefined) {
    throw new Error(
      `Dev trigger needs ranks ${from} and ${to}; the board has ${ranked.length} teams.`,
    )
  }
  return {
    id: `${week ?? 'x'}:${attacker.teamId}:${to}`,
    attacker: attacker.teamId,
    attackerName: attacker.ventureName,
    defender: defender.teamId,
    defenderName: defender.ventureName,
    fromRank: from,
    toRank: to,
  }
}

const BUTTON: React.CSSProperties = {
  font: '600 12px/1 ui-monospace, monospace',
  color: '#fff',
  background: '#111',
  border: '1px solid #444',
  borderRadius: 4,
  padding: '7px 10px',
  cursor: 'pointer',
}

export function DevKickTrigger({
  teams,
  week,
  onQueued,
  onReset,
}: {
  teams: readonly Team[]
  week: number | null
  onQueued: () => void
  /** Clears whatever is playing. Handed the same `settled` the animation calls. */
  onReset: () => void
}) {
  // The one check. `NODE_ENV` is inlined at build time, so this whole component
  // folds away in a production build.
  if (process.env.NODE_ENV !== 'development') return null

  const fire = (pairs: readonly (readonly [number, number])[]) => {
    const ranked = rankByWeek(teams)
    enqueueKicks(
      'weekly',
      pairs.map((pair) => eventFor(ranked, week, pair)),
    )
    onQueued()
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        zIndex: 9,
        display: 'flex',
        gap: 6,
        // Deliberately nothing like the board. This should never be mistaken for
        // part of the wall in a screenshot.
        opacity: 0.85,
      }}
    >
      <button type="button" style={BUTTON} onClick={() => fire([PAIRS[0]])}>
        Trigger kick
      </button>
      <button type="button" style={BUTTON} onClick={() => fire(PAIRS)}>
        Trigger burst
      </button>
      {/* Queue first, then what is playing: clearing them the other way round
          lets the drain pick up the next event on its way out and the board
          never reaches rest. */}
      <button
        type="button"
        style={BUTTON}
        onClick={() => {
          clearKicks('weekly')
          onReset()
        }}
      >
        Reset
      </button>
    </div>
  )
}
