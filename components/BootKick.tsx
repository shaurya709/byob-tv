'use client'

import Image from 'next/image'
import { cubicBezier, motion } from 'motion/react'

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

/**
 * Beat 2 — the attacker climbing to the row it is about to take.
 *
 * ── It stops one row short ──
 *
 * The beat always ends with the attacker *below* the slot, never in it. Taking
 * the slot is beat 6's job, after the strike. That ordering is what makes the
 * kick causal: the attacker arrives, kicks, and only then moves up. Arriving in
 * the slot first would make everything after it decoration.
 *
 * ── Vertical travel is a percentage, not pixels ──
 *
 * The element being moved is exactly one row tall, so `y: '100%'` is exactly one
 * row whatever the viewport. No `--h-row` constant is duplicated into TypeScript
 * and nothing is read back from the DOM — the row height stays defined in one
 * place, in CSS.
 *
 * ── The wobble is keyframes, not a spring ──
 *
 * A spring's lateral overshoot decays monotonically. A body climbing under its
 * own effort sways *against* the direction of travel first and then past centre,
 * and that asymmetry is what reads as effort. Only explicit stops express it.
 */
const TRAVEL_Y = cubicBezier(0.22, 0.68, 0.24, 1)

/**
 * Beat 3 — the wind-up.
 *
 * ── The boot enters by rotation, never by opacity ──
 *
 * There is no opacity animation on it anywhere. It starts cocked back at −78°
 * with its heel pinned at the mark's edge, where the mark occludes it, and the
 * rotation is what carries it into view. A fade would announce that a graphic
 * had arrived; a swing announces that a leg is being drawn back.
 *
 * That only works because the boot sits *below* the mark in paint order, which
 * is what the two `zIndex` values in the logo cell are for.
 *
 * ── Why it arrives slowing ──
 *
 * The curve accelerates into the cocked position and eases as it gets there.
 * Anticipation needs a moment of stillness at the top or the wind-up reads as
 * the first half of the strike and the beat disappears.
 */
const WIND_UP = cubicBezier(0.34, 0, 0.68, 0.6)

/**
 * Sway in px at the `w = 1` cap, scaled down by how far there is to climb. Zero
 * for a single-rank climb.
 *
 * The ratio between them is the read — a body climbing under its own effort
 * leans back further than it overshoots — so they move together or not at all.
 * The magnitudes were 6 and 4, which measured correctly and were invisible: at
 * Δ=3 that is a ±2px lean, and nothing 2px wide survives six metres. Scaled by
 * 2.5 so the widest throw is about half a logo across.
 */
const SWAY_BACK = -15
const SWAY_THROUGH = 10

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

  const to = rowTop(event.toRank, perColumn)
  const pushed = rowTop(defenderTo, perColumn)

  // How far the attacker climbs, and how far beat 2 carries it: one row short of
  // the slot. For a single-rank climb both terms are zero and the beat is a
  // no-op because its parameters are zero, not because a branch skipped it.
  const climb = event.fromRank - event.toRank
  const travelRows = climb - 1
  const sway = Math.min(travelRows, 6) / 6

  // Anchored where beat 2 ends. Beat 6 takes it the last row up from here.
  const home = pushed

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
        {/* Beat 2 — the climb, on transform. `top` is static: a position that
            animates cannot also carry a wobble, and mixing the two would put the
            same motion in two properties. */}
        <motion.div
          animate={{
            y: [`${travelRows * 100}%`, `${travelRows * 100}%`, '0%', '0%'],
            x: [0, 0, SWAY_BACK * sway, SWAY_THROUGH * sway, 0, 0],
          }}
          // The one animation that spans the whole timeline, so its completion is
          // beat 8's completion by construction rather than by coincidence. This
          // is the only callback in the component, and the queue's guard.
          transition={{
            duration: TOTAL,
            onComplete: onSettled,
            y: {
              duration: TOTAL,
              times: [0, at(BEATS.travel)[0], at(BEATS.travel)[1], 1],
              ease: ['linear', TRAVEL_Y, 'linear'],
            },
            x: {
              duration: TOTAL,
              times: [0, ...at(BEATS.travel, 0.32, 0.68), 1],
              ease: ['linear', 'easeInOut', 'easeInOut', 'easeInOut', 'linear'],
            },
          }}
          style={{ position: 'absolute', top: home, left: 0, right: 0, zIndex: 2 }}
        >
          <AtRow style={{ position: 'relative' }}>
            <motion.div
              animate={{ scale: [1, 1.45, 1.45, 1.7, 0.92, 1.2, 1] }}
              transition={{
                duration: TOTAL,
                times: [0, at(BEATS.collapse)[1], ...at(BEATS.settle, 0.25, 0.5, 0.75), 1],
                ease: 'easeOut',
              }}
              style={{ transformOrigin: 'center bottom', position: 'relative', zIndex: 1 }}
            >
              <VentureLogo team={attacker} size={MARK} />
            </motion.div>

            {/* Only ever visible for the wind-up and the strike. */}
            <motion.div
              initial={{ rotate: -78, scaleX: 0.78 }}
              animate={{
                rotate: [-78, -78, -16, -4, -4, -4],
                scaleX: [0.78, 0.78, 0.78, 1, 1, 1],
              }}
              transition={{
                duration: TOTAL,
                times: [
                  0,
                  at(BEATS.windUp)[0],
                  at(BEATS.windUp)[1],
                  at(BEATS.strike)[1],
                  at(BEATS.punt, 0.5)[1],
                  1,
                ],
                // Only the wind-up segment is specified here. The rest keeps the
                // default it already had, so beat 4 is untouched.
                ease: ['linear', WIND_UP, 'easeOut', 'easeOut', 'easeOut'],
              }}
              style={{
                position: 'absolute',
                top: '18%',
                left: MARK * 0.7,
                // Half what it was. At full size it covered the defender's
                // venture name at the strike and read as the subject of the
                // frame rather than as the instrument.
                width: MARK * 0.85,
                // Below the mark, which is what lets it start hidden and swing
                // out rather than appear.
                zIndex: 0,
                // The heel. The hinge sits at the mark's edge, low, so this is a
                // leg swinging from the hip rather than a sprite spinning about
                // its middle.
                transformOrigin: '0% 82%',
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
