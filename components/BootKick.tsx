'use client'

import Image from 'next/image'
import { motion } from 'motion/react'

import { ROW } from '@/components/VenturePill'
import { VentureLogo } from '@/components/VentureLogo'
import { BEATS, TOTAL, at } from '@/lib/kickTimeline'
import type { OvertakeEvent, Team } from '@/lib/types'

/**
 * The boot kick. The only thing on this wall that moves for a reason.
 *
 * Seven beats, three seconds, every one of them a declarative `delay` rather
 * than a chain of timers. The component is unmounted the moment the rotation
 * moves on, and a chain of `setTimeout`s would need teardown at seven points to
 * avoid firing into a dead component. There is nothing here to clean up.
 *
 * The windows live in `lib/kickTimeline.ts` and nothing here re-divides a number
 * by the total. Every animation below runs for `TOTAL` and uses `times` to say
 * which part of it belongs to which beat.
 *
 * ── Position is computed, never measured ──
 *
 * The overlay is built from the *same* grid and the *same* `ROW` template as the
 * board underneath, so a mark lands exactly where that team's logo already sits.
 * No `getBoundingClientRect`, nothing that can disagree with where the row
 * actually is, and no forced synchronous layout mid-animation on a machine
 * driving a panel for weeks. Change the row height and the kick follows.
 *
 * ── On the boot being missing ──
 *
 * If `boot.png` fails to load the kick still happens; the attacker's mark simply
 * moves into the slot. Failing loud on a wall is worse than failing quiet, and
 * this is the one place the brief asks for that.
 */

const MARK = 30

/** Where a rank's row sits inside its column, in the board's own units. */
function rowTop(rank: number, perColumn: number): string {
  return `calc(var(--h-col-head) + ${(rank - 1) % perColumn} * var(--h-row))`
}

/**
 * A row-shaped shell that puts its child exactly where that row's logo is.
 *
 * The rank cell is rendered as an empty spacer rather than omitted: the grid
 * template is what does the aligning, and a missing cell would shift everything
 * after it.
 */
function AtRow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ ...ROW, height: 'var(--h-row)', position: 'absolute', left: 0, right: 0, ...style }}>
      <span />
      <div style={{ position: 'relative' }}>{children}</div>
      <span />
      <span />
      <span />
    </div>
  )
}

export function BootKick({
  event,
  teams,
  perColumn,
  onSettled,
}: {
  event: OvertakeEvent
  teams: readonly Team[]
  perColumn: number
  /** Fired when the last beat finishes. The queue waits on this, not on a timer. */
  onSettled: () => void
}) {
  const find = (id: string, name: string): Team =>
    teams.find((team) => team.teamId === id) ?? {
      teamId: id,
      ventureName: name,
      totalRevenue: 0,
      weekRevenue: 0,
      todayRevenue: 0,
      totalUnits: 0,
    }

  const attacker = find(event.attacker, event.attackerName)
  const defender = find(event.defender, event.defenderName)

  // The defender is pushed one place down from the slot it lost. Both marks stay
  // in the column the contest happened in; a kick that crossed columns mid-beat
  // would read as a team leaving the board.
  const column = event.toRank <= perColumn ? 0 : 1
  const defenderTo = Math.min(event.toRank + 1, perColumn * (column + 1))

  const from = rowTop(event.fromRank, perColumn)
  const to = rowTop(event.toRank, perColumn)
  const pushed = rowTop(defenderTo, perColumn)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 3,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 'var(--s-16)',
      }}
    >
      {/* The empty half keeps the grid honest, so the busy half lands in the
          same place the board's own column does. */}
      {column === 1 && <div />}

      <div style={{ position: 'relative' }}>
        {/* The attacker climbs into the slot and lands on it. */}
        <motion.div
          initial={{ top: from }}
          animate={{ top: [from, to, to] }}
          // The one animation that spans the whole timeline, so its completion is
          // beat 8's completion by construction rather than by coincidence. This
          // is the only callback in the component, and the queue's guard.
          transition={{
            duration: TOTAL,
            times: [0, at(BEATS.travel)[1], 1],
            ease: 'easeOut',
            onComplete: onSettled,
          }}
          style={{ position: 'absolute', left: 0, right: 0, zIndex: 2 }}
        >
          <AtRow style={{ position: 'relative' }}>
            <motion.div
              animate={{ scale: [1, 1.45, 1.45, 1.7, 0.92, 1.2, 1] }}
              transition={{
                duration: TOTAL,
                times: [0, at(BEATS.collapse)[1], ...at(BEATS.settle, 0.25, 0.5, 0.75), 1],
                ease: 'easeOut',
              }}
              style={{ transformOrigin: 'center bottom' }}
            >
              <VentureLogo team={attacker} size={MARK} />
            </motion.div>

            {/* Only ever visible for the wind-up and the strike. */}
            <motion.div
              initial={{ opacity: 0, rotate: -14, scaleX: 0.78 }}
              animate={{
                opacity: [0, 0, 1, 1, 0, 0],
                rotate: [-14, -14, -14, -4, -4, -4],
                scaleX: [0.78, 0.78, 0.78, 1, 1, 1],
              }}
              transition={{
                duration: TOTAL,
                times: [
                  0,
                  at(BEATS.windUp)[0],
                  at(BEATS.windUp, 0.4)[1],
                  at(BEATS.strike)[1],
                  at(BEATS.punt, 0.5)[1],
                  1,
                ],
              }}
              style={{
                position: 'absolute',
                top: '18%',
                left: MARK * 0.7,
                width: MARK * 1.7,
                zIndex: 1,
                transformOrigin: 'left center',
              }}
            >
              <Image
                src="/assets/boot.png"
                alt=""
                width={320}
                height={280}
                style={{ width: '100%', height: 'auto' }}
                unoptimized
              />
            </motion.div>
          </AtRow>
        </motion.div>

        {/* Dust at the point of contact. */}
        <AtRow style={{ top: to }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0, 0.9, 0], scale: [0.4, 0.4, 1.5, 2], y: [0, 0, -16, -30] }}
            transition={{
              duration: TOTAL,
              times: [0, at(BEATS.strike)[1], at(BEATS.punt, 0.19)[1], at(BEATS.punt, 0.52)[1]],
            }}
            style={{
              position: 'absolute',
              left: MARK * 1.5,
              top: -6,
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--bright-green) 0%, transparent 70%)',
            }}
          />
        </AtRow>

        {/* Punted: up and forward, then down and back into the row below. */}
        <motion.div
          initial={{ top: to }}
          animate={{ top: [to, to, pushed] }}
          transition={{
            duration: TOTAL,
            times: [0, at(BEATS.punt)[0], at(BEATS.punt)[1]],
            ease: [0.4, 0, 0.6, 1],
          }}
          style={{ position: 'absolute', left: 0, right: 0 }}
        >
          <AtRow style={{ position: 'relative' }}>
            {/* The defender steps clear of the slot as the attacker arrives.
                Without it both marks occupy one 30px square for a second and a
                half and the contest is invisible — the boot swings behind them,
                which is exactly what the first attempt did. */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1.2, 1.2, 1],
                x: [0, 52, 52, 108, 0],
                y: [0, 0, 0, -30, 0],
                rotate: [0, 0, 0, 320, 540],
              }}
              transition={{
                duration: TOTAL,
                times: [
                  0,
                  at(BEATS.travel)[1],
                  at(BEATS.punt)[0],
                  at(BEATS.punt, 0.4)[1],
                  at(BEATS.punt)[1],
                ],
                ease: [0.4, 0, 0.6, 1],
              }}
            >
              <VentureLogo team={defender} size={MARK} />
            </motion.div>
          </AtRow>
        </motion.div>
      </div>

      {column === 0 && <div />}
    </div>
  )
}
