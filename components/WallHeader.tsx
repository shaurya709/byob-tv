import Image from 'next/image'

import { AsOf } from '@/components/AsOf'
import { FleaStrip } from '@/components/FleaStrip'
import { fleaInstant } from '@/lib/feed'
import type { Snapshot } from '@/lib/types'

/**
 * The band across the top of `/weekly`: Mesa in the corner, the heading, the
 * countdown, and provenance.
 *
 * ── Deep Forest, and the same material `/podium` uses ──
 *
 * It was three things floating on white at three scales with nothing binding
 * them and nothing separating them from the board — so the grid began wherever
 * the tallest of the three happened to stop. `/podium` solved the same problem
 * with a filled masthead; this is that masthead turned through ninety degrees.
 * Same fill, same near-white lockup, same trick of redefining `--fg-muted`
 * locally so the components inside keep asking for "muted" and the *surface*
 * decides what muted means on it.
 *
 * ── The countdown is the second-loudest thing on the board ──
 *
 * After rank 1's numeral and before everything else, which is a deliberate
 * inversion: it used to be smaller than the timestamp beside it. The Flea date
 * is the only element on this wall that changes what a team does today — a
 * board of standings tells forty teams where they are, and the countdown tells
 * them how long they have to move. `--h-tv-cal` and `--t-tv-cal-figure` are
 * redefined on the band rather than at the root, so `FleaDial` is unchanged and
 * the sizing lives with the surface that wanted it.
 *
 * Tangerine Glow, not Tangerine 600: the 600 was picked to survive a white
 * ground, and this ground is Deep Forest. On it the darker value goes muddy at
 * six metres while looking correct on a laptop.
 *
 * The as-of stamp goes the other way — down to a small tracked caption in muted
 * mint. It is provenance, and provenance recedes.
 */
export function WallHeader({ snapshot, label }: { snapshot: Snapshot | null; label?: string }) {
  return (
    <header className="tv-band">
      <Image
        src="/brand/logo-pg-white.png"
        alt="Mesa School of Business"
        width={448}
        height={128}
        // Near-white on the band, where the green lockup would disappear.
        style={{ height: 'var(--h-tv-logo)', width: 'auto', justifySelf: 'start' }}
        unoptimized
      />

      {/* An empty middle cell when there is no heading, so the right-hand group
          still lands in the third column rather than drifting to the centre. */}
      {label === undefined ? <span /> : <h1 className="tv-band-title">{label}</h1>}

      {/* Centred, not baseline: the dial is a block with no text baseline of its
          own, and baseline alignment would hang it low. */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-5)', justifySelf: 'end' }}
      >
        <FleaStrip at={snapshot === null ? null : fleaInstant(snapshot.cohort)} />
        <AsOf snapshot={snapshot} />
      </div>
    </header>
  )
}
