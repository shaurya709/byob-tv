import Image from 'next/image'

import { VentureLogo } from '@/components/VentureLogo'
import type { Team } from '@/lib/types'

/**
 * A venture's mark as a two-sided disc: its logo on the front, Mesa's own mark
 * on Deep Forest Green on the back.
 *
 * ── Why the back exists before anything flips it ──
 *
 * Nothing turns this over yet — the overtake flip is the next slice. The back is
 * built now because it is what makes the disc an *object* rather than a picture,
 * and because the alternative is discovering during the flip that every mark on
 * the wall has a mirror-image logo on its reverse. `backface-visibility: hidden`
 * on both faces is what prevents that, and it only works if there are two faces
 * to begin with.
 *
 * It also covers the idle: a mark rotated past 90° would otherwise show its own
 * front reversed. The idle's amplitudes stay well inside that, so this is a
 * guard rather than a visible state — but it is a guard that costs one element.
 *
 * ── The green is the same green ──
 *
 * `--deep-forest-green`, the logomark token, and the same value the card's logo
 * panel used before it was removed. A card mid-flip should be one object in one
 * colour rather than two.
 */

/**
 * The lockup's share of the disc's width.
 *
 * The full Mesa lockup rather than the abstract brand mark. Rendered on a
 * 156px disc and compared side by side, `brand-mark-solid` reads as an
 * unidentifiable white blob and both concentric variants are either a soft glow
 * or rings too fine to survive six metres. The lockup is the only one that says
 * *Mesa* at this size, which is the entire job of a card back.
 */
const MARK_SCALE = 0.74

export function VentureDisc({
  team,
  idle,
  delaySeconds,
}: {
  team: Team
  /** An idle timeline class. Absent means a mark that does not move at all. */
  idle?: string
  /** Phase offset, so ten marks on one row never fall into step. */
  delaySeconds?: number
}) {
  return (
    <div
      className={`tv-disc${idle === undefined ? '' : ` ${idle}`}`}
      style={{
        width: 'var(--d-card-logo)',
        height: 'var(--d-card-logo)',
        // Negative, so the timeline starts partway through rather than every
        // mark beginning its first bob on the same frame.
        ...(delaySeconds === undefined ? {} : { animationDelay: `-${delaySeconds}s` }),
        ...(idle === undefined ? {} : { willChange: 'transform' }),
      }}
    >
      <div className="tv-disc-face">
        {/* The token, not `100%`. `VentureLogo` derives its initial's font size
            and corner radius with `calc(size * k)`, and a *percentage* there
            resolves against the parent's font size rather than the disc's width
            — measured: every team without artwork rendered a flat ellipse with
            a letter a few pixels tall, on a board that otherwise looked right. */}
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
    </div>
  )
}
