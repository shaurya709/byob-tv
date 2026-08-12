import Image from 'next/image'

import { LOGOS } from '@/config'
import { hashTeamId } from '@/lib/seed'
import type { Team } from '@/lib/types'

/**
 * A venture's mark: its logo if one has been committed, otherwise a coloured
 * initial.
 *
 * **The initial square is not a fallback, it is the common case.** Zero of 42
 * logos exist today, so on the wall's first day every tile on the podium and
 * every notification card is one of these. It gets the same care as the logo
 * path — if it looked like an error state, the whole wall would look broken.
 *
 * Which teams have a logo is known from `config.ts` before render, so no broken
 * image is ever requested and there is no error-handler flash. Adding a logo is
 * one commit: drop the file in `public/logos/` and add the team ID to `LOGOS`.
 */

/**
 * Six brand tints, chosen so adjacent podium tiles rarely collide and so the
 * set reads as one family rather than six unrelated colours.
 *
 * Assigned by hashing the team ID rather than by rank, so a venture keeps the
 * same colour as it climbs — the mark is an identity, and one that changed
 * colour on promotion would read as a different venture.
 */
const TINTS = [
  'var(--deep-forest-green)',
  'var(--tangerine-600)',
  'var(--green-600)',
  'var(--deep-teal)',
  'var(--tangerine-glow)',
  'var(--mint-300)',
] as const

/** Tints light enough to need dark type on top. */
const LIGHT_TINTS = new Set(['var(--tangerine-glow)', 'var(--mint-300)'])

function tintFor(teamId: string): string {
  return TINTS[hashTeamId(teamId) % TINTS.length]
}

/**
 * The venture's first letter, or the team ID's last digit when it has no name
 * yet. A nameless team never fires a trigger, but it can still appear on the
 * podium, and `SLE-C407` needs *something* in its tile.
 */
function initialFor(team: Team): string {
  const letter = team.ventureName.trim().charAt(0)
  if (letter !== '') return letter.toUpperCase()
  return team.teamId.trim().slice(-1)
}

/**
 * `size` takes a number of pixels, or any CSS length.
 *
 * The weekly board passes a number, because its rows are a fixed 30px mark.
 * The podium passes `vw`: a mark that stayed put while every dimension around
 * it scaled was measured climbing into the header band at 1600x900, which is
 * the whole reason this component accepts a CSS length at all.
 */
export function VentureLogo({ team, size }: { team: Team; size: number | string }) {
  const dim = typeof size === 'number' ? `${size}px` : size
  const radius = `calc(${dim} * 0.18)`

  if (LOGOS.includes(team.teamId)) {
    return (
      <Image
        src={`/logos/${team.teamId}.png`}
        alt={team.ventureName || team.teamId}
        // Intrinsic hints for the image loader only; the CSS below sizes it.
        width={200}
        height={200}
        style={{ width: dim, height: dim, borderRadius: radius, objectFit: 'contain' }}
        unoptimized
      />
    )
  }

  const tint = tintFor(team.teamId)
  return (
    <div
      aria-label={team.ventureName || team.teamId}
      role="img"
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
        background: tint,
        color: LIGHT_TINTS.has(tint) ? 'var(--midnight-charcoal)' : 'var(--white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Optically centred: a capital sits high in its em box, so centring the
        // box leaves the letter looking a touch above centre in a square.
        lineHeight: 1,
        paddingTop: `calc(${dim} * 0.03)`,
        fontFamily: 'var(--font-serif)',
        fontWeight: 700,
        fontSize: `calc(${dim} * 0.52)`,
      }}
    >
      {initialFor(team)}
    </div>
  )
}
