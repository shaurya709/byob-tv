'use client'

import { useEffect } from 'react'
import { motion, type Easing } from 'motion/react'

import { VentureDisc } from '@/components/VentureDisc'
import { formatRupees } from '@/lib/format'
import { BEATS, TOTAL, at, type FlipCue } from '@/lib/flipTimeline'
import { nameOf } from '@/lib/team'
import type { Team } from '@/lib/types'

/**
 * One team's card: a solid Deep Forest object carrying rank, mark, venture name
 * and figure — the same anatomy a podium pillar has, at grid scale.
 *
 * ── What this replaced, and why ──
 *
 * The board used to be forty marks floating over forty near-invisible bases, and
 * it read as a sticker sheet. Four things caused that and all four are fixed
 * here rather than softened:
 *
 * - **The rank was painted on the artwork.** It needed a triple white
 *   drop-shadow to survive forty unknown logos and still lost — ranks 12 and 13
 *   were half-swallowed by SORTD and Blunnt. The badge is on the card's own
 *   surface now, where nothing of the venture's can cover it.
 * - **Nothing bound a mark to its figure.** The card does.
 * - **There was no venture name at all.** It was removed when the base was too
 *   small to hold one; the card is not.
 * - **Twenty zero-revenue teams were as loud as the earners.** They are quiet
 *   cards now — see `quiet` below.
 *
 * ── One treatment per card, never both ──
 *
 * Ranks 4–40 get the badge. Ranks 1–3 get `/podium`'s metal numeral instead,
 * breaking above the card's top edge, in the podium's own class so the two
 * boards say gold with one implementation rather than two that drift.
 *
 * ── Rank sits on the cell, not on the card ──
 *
 * Both treatments are outside the travelling element, deliberately. Rank is a
 * fact about the *board*: a number that flew across the frame with a card would
 * be claiming to belong to the venture rather than to the position.
 */

/**
 * ── ONE FIGURE, AND TODAY IS THE ONE THAT WENT ──
 *
 * The card used to carry two: the week's revenue and, under it, "TODAY ₹x" —
 * which turned green above `HOT_TODAY_MIN` and was the wall's single emphasis.
 * The rebuilt anatomy is rank, mark, name, figure, and that is four things on a
 * card that is now also carrying a venture name it did not carry before.
 *
 * **This is a real loss and it is worth naming rather than burying.** With today
 * gone the board says who is ahead this week but no longer says who is moving
 * right now, and a wall watched at 4pm on a busy Friday used to answer that.
 *
 * It is one line to restore: a second `.tv-figure` under the week's, in
 * `--t-tv-card-today`, coloured `--green-600` when `todayRevenue >=
 * HOT_TODAY_MIN`. `--h-card-fig` in app/mesa-tv.css is what reserves the room,
 * and `--h-card` would need about 1.2vw back to pay for the line.
 */

/**
 * The three metals, by rank. **The podium's tokens, not copies of them** — the
 * two boards are in one rotation and a wall that says gold two ways is a wall
 * with a bug in it. Bronze is the settled `--metal-bronze`; the redder value it
 * replaced read as orange against `--tangerine-600`.
 */
const METALS = ['var(--metal-gold)', 'var(--metal-silver)', 'var(--metal-bronze)'] as const

/**
 * The whole card crosses to the other slot.
 *
 * **This is a pure translation now, and that is a consequence of the ramp
 * going.** The four rows used to be four different heights, so a flip that
 * crossed a row boundary had to resize on the way — which meant the mark
 * travelled on its own, separately from its base, with the base collapsing into
 * it to hide the fact that the two were different sizes at the two ends. Every
 * cell is the same size now, so the card simply moves: no scale, nothing to
 * snap at the settle, and one moving object instead of two.
 *
 * `x`/`y` hold at zero until the travel opens, so the turn happens in place, and
 * hold at the destination afterwards so the unturn happens there. Both end
 * exactly on the position the re-sorted board is about to give this card, which
 * is what makes the settle invisible.
 */
const TRAVEL_EASE: Easing[] = ['linear', 'easeInOut', 'linear']

function travelMotion(cue: FlipCue) {
  const window = at(BEATS.travel, cue.role === 'defender' ? cue.shift : 0)
  return {
    animate: { x: [0, 0, cue.dx, cue.dx], y: [0, 0, cue.dy, cue.dy] },
    transition: { duration: TOTAL, times: [0, ...window, 1], ease: TRAVEL_EASE },
  }
}

export function VentureCard({
  team,
  rank,
  idle,
  delaySeconds,
  cue,
  onSettled,
}: {
  team: Team
  rank: number
  /** An idle timeline class. Only row 1 gets one; the other thirty hold still. */
  idle?: string
  /** Phase offset, so ten marks on one row never fall into step. */
  delaySeconds?: number
  /** Set only while this card is in a flip. Absent means an ordinary, inert card. */
  cue?: FlipCue
  /** Called once, by the attacker's card, when the last beat finishes. */
  onSettled?: () => void
}) {
  /**
   * **A team with no revenue this week, not a team with no revenue today.**
   *
   * The board ranks on the week, so the week is what "has this team traded"
   * means here. In week 4 that is twenty of forty cards, which is exactly why
   * the quiet treatment exists: twenty em dashes in twenty boxes as loud as the
   * earners' taught the eye to skip the column that matters.
   */
  const quiet = team.weekRevenue <= 0
  const flips = cue !== undefined && cue.role !== 'slide'
  // `false`, not `undefined`, for a card with no cue: the reset to x/y 0 has to
  // land in the same commit as the settle's re-slot, or the board would be seen
  // reordering under a card that had already finished moving.
  const travel =
    cue === undefined
      ? { animate: { x: 0, y: 0 }, transition: { duration: 0 } }
      : travelMotion(cue)

  /**
   * The deadlock guard. `onSettled` is the only thing standing between the queue
   * and a wedge: if this card unmounts before its animation completes — the
   * rotation moving on mid-flip, or a board that re-sorted underneath it —
   * nothing would ever report the flip finished and `playing` would pin forever.
   * The cleanup reports it instead. Idempotent by construction, so the normal
   * path calling both is harmless.
   */
  const attacker = cue?.role === 'attacker'
  useEffect(() => {
    if (!attacker) return
    return () => onSettled?.()
  }, [attacker, onSettled])

  return (
    <div
      // Named so `scripts/measure-fit.mjs` can find the grid's true top edge.
      className="tv-card-cell"
      // The brain reads cell geometry by rank when a flip starts. Untransformed
      // layout only — `getBoundingClientRect` on a cell is safe because cells
      // never move; it is the card inside them that does.
      data-rank={rank}
      style={{
        height: '100%',
        position: 'relative',
        // A card in a flip paints over its neighbours. Without this it crosses
        // *under* the cards it is passing, which reads as the board swallowing
        // it rather than as one card overtaking another.
        ...(cue === undefined ? {} : { zIndex: 3 }),
      }}
    >
      {/* Board apparatus, not the team's — see the header note. */}
      {rank <= 3 ? (
        <span
          className="tv-card-numeral"
          style={{ '--pod-metal': METALS[rank - 1] } as React.CSSProperties}
        >
          {/* `/podium`'s class, carrying the face, the cap trim, the metal and
              the lustre. This board contributes only the size. */}
          <span className="tv-pod-numeral" role="img" aria-label={`Rank ${rank}`}>
            {rank}
          </span>
        </span>
      ) : (
        <span className="tv-card-badge">{rank}</span>
      )}

      <motion.div
        {...travel}
        // The travel is the longest-running property in the sequence, so its
        // completion is the sequence's. Component-level, not transition-level:
        // the old kick measured the per-transition `onComplete` never firing at
        // all once the transition carried per-property overrides, which wedged
        // the queue with nothing on screen progressing.
        onAnimationComplete={attacker ? onSettled : undefined}
        className={quiet ? 'tv-card tv-card-quiet' : 'tv-card'}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateRows: 'auto auto auto',
          justifyItems: 'center',
          alignContent: 'center',
          gap: 'var(--s-card-row-gap)',
          padding: 'var(--s-card-pad-y) var(--s-card-inset)',
          minWidth: 0,
        }}
      >
        {/* **On the disc's direct parent, not on the cell.** `perspective`
            applies only to an element's own children, so one level further up it
            does nothing and the turn renders orthographically — a flat squash
            rather than a mark tipping its face. Measured while it sat on the
            cell: the disc's height was exactly cos(30°) of its width, which is
            the signature of no perspective at all. */}
        <div style={{ display: 'grid', placeItems: 'center', perspective: '900px' }}>
          <VentureDisc
            team={team}
            idle={idle}
            delaySeconds={delaySeconds}
            {...(flips ? { flipShift: cue.shift } : {})}
          />
        </div>

        {/* **The name is back.** It was dropped when the base was too small to
            hold one; the card is not. `nameOf` gives an unnamed team its team id
            rather than a blank — the wall names every card it draws. */}
        <div className="tv-card-name" style={{ minHeight: 'var(--h-card-name)' }}>
          {nameOf(team)}
        </div>

        {/* The figure the board exists to show. **Nothing at all on a quiet
            card** — not an em dash, not a zero. The card is already saying it. */}
        <div
          className="tv-figure"
          style={{
            font: 'var(--t-tv-card-week)',
            color: 'var(--tv-card-fig-ink)',
            // Reserved whether or not there is a figure, so a quiet card's disc
            // sits on the same line as its neighbours' rather than dropping the
            // whole card half a line.
            minHeight: 'var(--h-card-fig)',
          }}
        >
          {quiet ? '' : formatRupees(team.weekRevenue)}
        </div>
      </motion.div>
    </div>
  )
}
