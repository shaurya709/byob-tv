'use client'

import { useEffect } from 'react'
import { motion, type Easing } from 'motion/react'

import { VentureDisc } from '@/components/VentureDisc'
import { HOT_TODAY_MIN, SOLID_RANKS } from '@/config'
import { formatRupees } from '@/lib/format'
import { BEATS, TOTAL, TURN_AT, at, type FlipCue } from '@/lib/flipTimeline'
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
 * - **Every card was as loud as every other.** The bottom half of the board is
 *   the pale outlined kind now — see `quiet` below. The rule was revenue and is
 *   rank; the figure is what still follows revenue.
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
 * ── THE NAME WENT AND TODAY CAME BACK, ONTO THE SAME LINE ──
 *
 * The anatomy is rank, mark, week, today. It was rank, mark, name, week for one
 * revision, and the swap is deliberate rather than a reversal that lost track of
 * itself:
 *
 * - **The mark already identifies the venture at this size.** A 116px disc of a
 *   team's own artwork and its name underneath are the same fact printed twice,
 *   and the second printing cost the only line the card had spare.
 * - **Today was the only thing on the board that said who is moving *now*.**
 *   Without it the wall is a weekly summary on a screen; a passer-by at 4pm on a
 *   busy Friday has no way to see the afternoon in it.
 *
 * It also settles the overflow question the name never answered: five of forty
 * names did not fit on one line at 156px, and no truncation, marquee or short
 * display-name column is needed for a line that is no longer there.
 *
 * **The cost, stated rather than buried:** a team with no artwork is now a
 * coloured initial with no name anywhere on the card. Two teams are in that
 * state today. The disc's `alt` still carries the venture name, so the board is
 * not lying to anything that reads it — but at six metres those two cards say
 * only a letter, and that is the price of the line.
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
   * **Quiet is a fact about the slot now, not about the team.**
   *
   * It used to be `weekRevenue <= 0`, which in week 4 left thirty solid cards on
   * a forty-card board. Rank is the rule instead: the top `SOLID_RANKS` are
   * solid Deep Forest, the rest are the pale outlined kind — see the token for
   * why the line sits where it does.
   *
   * **A team with no revenue this week still prints no figure**, wherever it
   * ranks. The two rules are deliberately separate: one governs how much of the
   * board a card claims, the other whether there is a number to say. A pale card
   * that earned keeps its figure, and a solid card that has not traded — which
   * happens on a Monday, when twenty cards are at zero and someone still holds
   * rank 1 — shows nothing rather than `₹0`.
   */
  const quiet = rank > SOLID_RANKS
  const traded = team.weekRevenue > 0

  /**
   * The board's one emphasis: a day at or above `HOT_TODAY_MIN` reads as a
   * strong day. It is a display decision and nothing fires on crossing it, so a
   * team moving above and below the line through an afternoon is free to.
   */
  const hot = team.todayRevenue >= HOT_TODAY_MIN

  /**
   * A card crossing the line mid-flip, and which way.
   *
   * The surface travels with the card because the card is what moves; the badge
   * stays behind on the cell and is styled by the cell's own rank. `undefined`
   * for every card that is not crossing, which is all forty of them on all but
   * the two or three flips a week that touch rank `SOLID_RANKS`.
   */
  const turning =
    cue === undefined || cue.toRank > SOLID_RANKS === quiet
      ? undefined
      : cue.toRank > SOLID_RANKS
        ? 'tv-card-turn-quiet'
        : 'tv-card-turn-solid'

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
        // **The quiet chip is selected here, not in CSS.** The badge is a child
        // of the cell rather than of the card — rank belongs to the board — so
        // the `.tv-card-quiet .tv-card-badge` rule that used to carry this was a
        // descendant selector with no descendant, and never once matched: every
        // pale card on the board has been wearing a solid dark chip. The cell's
        // own rank is the right authority anyway, since the badge does not
        // travel with the card that leaves it.
        <span className={quiet ? 'tv-card-badge tv-card-badge-quiet' : 'tv-card-badge'}>
          {rank}
        </span>
      )}

      <motion.div
        {...travel}
        // The travel is the longest-running property in the sequence, so its
        // completion is the sequence's. Component-level, not transition-level:
        // the old kick measured the per-transition `onComplete` never firing at
        // all once the transition carried per-property overrides, which wedged
        // the queue with nothing on screen progressing.
        onAnimationComplete={attacker ? onSettled : undefined}
        className={[quiet ? 'tv-card tv-card-quiet' : 'tv-card', turning].filter(Boolean).join(' ')}
        style={{
          // The turn's delay, in the timeline's own terms. A CSS animation
          // rather than a timer: a card unmounts mid-flip every time the
          // rotation moves on, and an animation dies with its element where a
          // `setTimeout` would fire into a dead component and need tearing down
          // at exactly the beat nothing else in this sequence needs it.
          ...(turning === undefined
            ? {}
            : ({ '--tv-turn-at': `${TURN_AT + (cue?.shift ?? 0)}s` } as React.CSSProperties)),
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

        {/* The figure the board exists to show. **Nothing at all on a team that
            has not traded** — not an em dash, not a zero. Pale is not what
            decides this; an empty week is. */}
        <div
          className="tv-figure"
          style={{
            font: 'var(--t-tv-card-week)',
            color: 'var(--card-fig-ink)',
            // Reserved whether or not there is a figure, so a quiet card's disc
            // sits on the same line as its neighbours' rather than dropping the
            // whole card half a line.
            minHeight: 'var(--h-card-fig)',
          }}
        >
          {traded ? formatRupees(team.weekRevenue) : ''}
        </div>

        {/* ── Today, back on the card ──

            The line the venture name occupied is today's again. The name went
            because the mark already identifies the venture at this size — forty
            logos and forty names is the same fact printed twice — and what the
            board lost when today went was the only thing on it that said who is
            moving *right now*. A wall glanced at on a busy Friday answers that
            question or it is a weekly summary that happens to be on a screen.

            **The tag rides the figure and appears only with it.** Two bare rupee
            amounts on a card with no room for column headings leave a passer-by
            no way to tell the week from the day; a permanent caption over an
            empty line would be apparatus describing absence, on all forty cards
            every morning before the first sale. */}
        <div
          className={hot ? 'tv-card-today tv-card-today-hot' : 'tv-card-today'}
          style={{ minHeight: 'var(--h-card-today)' }}
        >
          {team.todayRevenue > 0 ? (
            <>
              <span className="tv-card-today-tag">Today</span>
              {formatRupees(team.todayRevenue)}
            </>
          ) : (
            ''
          )}
        </div>
      </motion.div>
    </div>
  )
}
