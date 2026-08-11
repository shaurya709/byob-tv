import Image from 'next/image'

import { AsOf } from '@/components/AsOf'
import { FleaStrip } from '@/components/FleaStrip'
import { fleaInstant } from '@/lib/feed'
import type { Snapshot } from '@/lib/types'

/**
 * The thin strip across the top of both slides: Mesa on the left, provenance on
 * the right.
 *
 * The `label` slot is the slide's heading — `/weekly` puts "BYOB Week 4"
 * there, set as a real heading in Deep Teal rather than a corner caption.
 * Nothing goes in it by default: on `/podium` the board is self-evident, and a
 * heading added because the corner looked bare is exactly the filler this wall
 * does not carry.
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--s-8)',
        height: 'var(--h-header)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-6)' }}>
        <Image
          src="/brand/logo-pg-green.png"
          alt="Mesa School of Business"
          width={148}
          height={52}
          style={{ height: '1.5vw', width: 'auto' }}
          unoptimized
        />
        {label !== undefined && (
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
      </div>

      {/* Centred, not baseline: the calendar page is a block with no text
          baseline of its own, and baseline alignment would hang it low. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-5)' }}>
        <FleaStrip at={snapshot === null ? null : fleaInstant(snapshot.cohort)} />
        <AsOf snapshot={snapshot} />
      </div>
    </header>
  )
}
