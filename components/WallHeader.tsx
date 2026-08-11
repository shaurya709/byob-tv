import Image from 'next/image'

import { AsOf } from '@/components/AsOf'
import { FleaStrip } from '@/components/FleaStrip'
import { fleaInstant } from '@/lib/feed'
import type { Snapshot } from '@/lib/types'

/**
 * The thin strip across the top of both slides: Mesa in the corner, the
 * heading centred, provenance on the right.
 *
 * The `label` slot is the slide's heading — `/weekly` puts "BYOB Week 4"
 * there, set as a real heading in Deep Teal, centred on the frame itself. A
 * three-column grid with equal outer tracks is what centres it: the logo and
 * the provenance group sit in the flanks, so the heading's centre is the
 * slide's centre whatever either side happens to weigh. Nothing goes in the
 * slot by default: on `/podium` the board is self-evident, and a heading added
 * because the corner looked bare is exactly the filler this wall does not
 * carry.
 *
 * The right-hand group is the wall's whole apparatus: how long until the Flea,
 * and when the numbers underneath were last refreshed. Both are ambient — the
 * smallest type on the frame — and both disappear rather than showing a
 * placeholder when the sheet has not supplied them.
 */
export function WallHeader({ snapshot, label }: { snapshot: Snapshot | null; label?: string }) {
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 'var(--s-8)',
        height: 'var(--h-header)',
      }}
    >
      <Image
        src="/brand/logo-pg-green.png"
        alt="Mesa School of Business"
        width={148}
        height={52}
        // The heading's own glyph height, so mark and heading carry equal rank.
        style={{ height: 'var(--h-tv-logo)', width: 'auto', justifySelf: 'start' }}
        unoptimized
      />

      {/* An empty middle cell when there is no heading, so the provenance group
          still lands in the third column rather than drifting to the centre. */}
      {label === undefined ? (
        <span />
      ) : (
        <h1
          style={{
            font: 'var(--t-tv-heading)',
            letterSpacing: 'var(--track-tv-heading)',
            textTransform: 'uppercase',
            color: 'var(--deep-teal)',
            margin: 0,
          }}
        >
          {label}
        </h1>
      )}

      {/* Centred, not baseline: the calendar stack is a block with no text
          baseline of its own, and baseline alignment would hang it low. */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-5)', justifySelf: 'end' }}
      >
        <FleaStrip at={snapshot === null ? null : fleaInstant(snapshot.cohort)} />
        <AsOf snapshot={snapshot} />
      </div>
    </header>
  )
}
