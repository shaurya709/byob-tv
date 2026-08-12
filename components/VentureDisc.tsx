'use client'

import Image from 'next/image'
import { motion, type Easing } from 'motion/react'

import { VentureLogo } from '@/components/VentureLogo'
import { BEATS, TOTAL, at } from '@/lib/flipTimeline'
import type { Team } from '@/lib/types'

/**
 * A venture's mark as a two-sided disc: its logo on the front, Mesa's own mark
 * on Deep Forest Green on the back.
 *
 * ── Three layers, because three things transform independently ──
 *
 * The idle and the flip both want `transform` on the mark, and a CSS animation
 * beats an inline style — so if they shared an element the idle would simply
 * win and the card would never turn over. They are therefore separate boxes:
 *
 *   travel wrapper  (in `VentureCard`; Motion: x / y / scale, and `perspective`)
 *     └ idle box    (CSS: bob, look down, glance — row 1 only)
 *         └ flip box (Motion: rotateY, and the 3D context the faces need)
 *             └ two faces
 *
 * `perspective` sits on the travel wrapper and reaches the flip box because the
 * idle box carries `preserve-3d`; without that it would stop one level short and
 * the turn would render as a flat horizontal squash.
 *
 * ── Why the back exists ──
 *
 * `backface-visibility: hidden` needs two faces to work against. Without a back,
 * a card turned past 90° shows its own front mirrored — measured, before this
 * had one.
 */

/**
 * The lockup's share of the disc's width.
 *
 * The full Mesa lockup rather than the abstract brand mark. Rendered on a 156px
 * disc and compared side by side, `brand-mark-solid` reads as an unidentifiable
 * white blob and both concentric variants are either a soft glow or rings too
 * fine to survive six metres. The lockup is the only one that says *Mesa* at
 * this size, which is the entire job of a card back.
 */
const MARK_SCALE = 0.74

/**
 * Out to face-down, hold there through the travel, back to face-up.
 *
 * One continuous direction — 0° → 180° → 360° — rather than turning back the way
 * it came. A card that unwinds reads as the flip being undone; a card that keeps
 * going reads as having arrived.
 */
const FLIP_EASE: Easing[] = ['linear', 'easeInOut', 'linear', 'easeInOut', 'linear']

function flipMotion(shift: number) {
  return {
    animate: { rotateY: [0, 0, 180, 180, 360, 360] },
    transition: {
      duration: TOTAL,
      times: [0, ...at(BEATS.flipOut, shift), ...at(BEATS.flipIn, shift), 1],
      ease: FLIP_EASE,
    },
  }
}

export function VentureDisc({
  team,
  idle,
  delaySeconds,
  flipShift,
}: {
  team: Team
  /** An idle timeline class. Absent means a mark that does not move at all. */
  idle?: string
  /** Phase offset for the idle, so ten marks on one row never fall into step. */
  delaySeconds?: number
  /** Set only while this card is in a flip; the defender's is `STAGGER`. */
  flipShift?: number
}) {
  const flipping = flipShift !== undefined

  return (
    <div
      // The idle is suspended for the duration of a flip. Two things moving the
      // same mark at once is not a richer animation, it is an unreadable one —
      // and the flip is the event, where the idle is only weather.
      className={idle === undefined || flipping ? undefined : idle}
      style={{
        width: 'var(--d-card-logo)',
        height: 'var(--d-card-logo)',
        transformStyle: 'preserve-3d',
        ...(delaySeconds === undefined || flipping
          ? {}
          : { animationDelay: `-${delaySeconds}s` }),
        ...(idle === undefined || flipping ? {} : { willChange: 'transform' }),
      }}
    >
      <motion.div
        className="tv-disc"
        {...(flipping ? flipMotion(flipShift) : {})}
        style={{ width: '100%', height: '100%' }}
      >
        <div className="tv-disc-face">
          {/* The token, not `100%`. `VentureLogo` derives its initial's font size
              and corner radius with `calc(size * k)`, and a *percentage* there
              resolves against the parent's font size rather than the disc's
              width — measured: every team without artwork rendered a flat
              ellipse with a letter a few pixels tall. */}
          <VentureLogo team={team} size="var(--d-card-logo)" />
        </div>
        <div className="tv-disc-face tv-disc-back">
          {/* Decorative: the venture's identity is on the front, and the alt text
              there already names it. A second label here would have a screen
              reader announce Mesa once per card, forty times. */}
          <Image
            src="/brand/logo-pg-white.png"
            alt=""
            width={448}
            height={128}
            style={{ width: `${MARK_SCALE * 100}%`, height: 'auto' }}
            unoptimized
          />
        </div>
      </motion.div>
    </div>
  )
}
