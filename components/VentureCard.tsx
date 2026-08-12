'use client'

import { useEffect } from 'react'
import { motion, type Easing } from 'motion/react'

import { HOT_TODAY_MIN } from '@/config'
import { VentureDisc } from '@/components/VentureDisc'
import { formatRupees } from '@/lib/format'
import { BEATS, TOTAL, at, type FlipCue } from '@/lib/flipTimeline'
import type { Team } from '@/lib/types'

/**
 * One team's card: a base carrying the team's details, with the venture's mark
 * floating as a disc above it.
 *
 * ── There is no logo panel any more ──
 *
 * The mark used to sit inside a Deep Forest Green section filling the card's top
 * half. The disc replaced it: the card is now the base, and the mark hovers over
 * it on the page's own white.
 *
 * That removal also settled a defect the panel had created. Two of
 * `VentureLogo`'s six identity tints are Deep Forest Green and Deep Teal — the
 * panel's own colour and its neighbour — so four teams without artwork had discs
 * that could not be seen against it, and they needed a mint hairline to have any
 * edge at all. On white every tint reads, and the hairline is gone with the
 * panel that made it necessary.
 *
 * ── The base is a fixed height; the disc absorbs the ramp ──
 *
 * Row heights descend from row 1 to row 4 and *all* of that variance lands on
 * the mark. The name and both figures are the same size on rank 1 and rank 40,
 * so forty cards read as one system and only the marks change scale.
 *
 * ── Only one thing is ever emphasised ──
 *
 * A strong day, today ≥ ₹5,000. Everything else — the rank badge included, rank
 * 1 the same as rank 40 — is one uniform treatment. With forty cards on a wall,
 * a second emphasis would mean nothing is emphasised.
 */

/**
 * `--green-600`, not `--bright-green`, for a strong day.
 *
 * On this wall's white surface `#6ED190` measures about 1.9:1 — invisible from a
 * corridor — because the token was drawn for dark marketing surfaces.
 * `--green-600` is the same hue one step deeper and is an existing brand token.
 */
const HOT = 'var(--green-600)'

/**
 * Above and below the cohort's average today.
 *
 * **There is no red in the Mesa palette.** The warm end stops at tangerine, and
 * both `AGENTS.md` and this file's own header forbid inventing a hue. So "below
 * average" is `--tangerine-600`, which is the brand's existing alert colour and
 * the same one the podium's figures use. If a true red is wanted it is a new
 * brand token, not a local literal.
 */
const UP = 'var(--green-600)'
const DOWN = 'var(--tangerine-600)'

/**
 * The disc's whole journey: it crosses to the other card's slot and, if that slot
 * belongs to a row of a different height, arrives already the size that row draws
 * it at. The resize rides the travel rather than snapping at either end.
 *
 * `x`/`y` hold at zero until the travel opens, so the flip happens in place, and
 * hold at the destination afterwards so the unflip happens there. Both end
 * exactly on the position the re-sorted board will give this card, which is what
 * makes the settle invisible.
 */
const TRAVEL_EASE: Easing[] = ['linear', 'easeInOut', 'linear']
const BASE_EASE_LONG: Easing[] = ['linear', 'easeIn', 'linear', 'linear', 'easeOut']

function travelMotion(cue: FlipCue) {
  const window = at(BEATS.travel, cue.role === 'defender' ? cue.shift : 0)
  return {
    animate: {
      x: [0, 0, cue.dx, cue.dx],
      y: [0, 0, cue.dy, cue.dy],
      scale: [1, 1, cue.scale, cue.scale],
    },
    transition: {
      duration: TOTAL,
      times: [0, ...window, 1],
      ease: TRAVEL_EASE,
    },
  }
}

/**
 * The base is drawn *up into the disc* and gone, then slides back down out of it.
 *
 * Not a fade where it stands. It scales toward the mark above it as it goes, so
 * the disc reads as having picked the card's contents up — which is what makes
 * the face-down disc feel like it is carrying the team rather than having
 * outlived it. `transformOrigin: top` is what aims the collapse at the disc.
 *
 * It finishes before the turn does, so nothing is still legible while the card is
 * edge-on, and it returns only after the card has landed and turned face-up.
 */
function baseMotion(cue: FlipCue) {
  const out = at(BEATS.baseOut, cue.shift)
  const travel = at(BEATS.travel, cue.role === 'defender' ? cue.shift : 0)
  const back = at(BEATS.baseIn, 0)
  return {
    animate: {
      opacity: [1, 1, 0, 0, 0, 1],
      scaleY: [1, 1, 0.35, 0.35, 0.35, 1],
      // **The base crosses too, while nobody can see it.** It is invisible for
      // the whole travel window, so this move is never watched — but without it
      // the base reappears in the slot the card came from while its own mark is
      // standing in the new one. Measured: rank 5 showed Snapper's mark above
      // CHAKHANA's figures, a card arriving in two pieces.
      x: [0, 0, 0, cue.dx, cue.dx, cue.dx],
      y: [0, 0, -8, cue.baseDy - 8, cue.baseDy, cue.baseDy],
    },
    transition: {
      duration: TOTAL,
      times: [0, out[0], out[1], travel[1], back[0], back[1]],
      ease: BASE_EASE_LONG,
    },
  }
}

/**
 * A card merely making room. It never turns over, so both halves simply travel,
 * in full view, on the same window the contestants cross on — and the base has
 * to go with the mark or the card tears in half exactly as a contestant's would.
 */
function slideBaseMotion(cue: FlipCue) {
  const travel = at(BEATS.travel, cue.shift)
  return {
    animate: { x: [0, 0, cue.dx, cue.dx], y: [0, 0, cue.baseDy, cue.baseDy] },
    transition: { duration: TOTAL, times: [0, ...travel, 1], ease: TRAVEL_EASE },
  }
}

export function VentureCard({
  team,
  rank,
  idle,
  delaySeconds,
  cue,
  onSettled,
  todayTone,
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
  /**
   * Optional: colour today's figure against the cohort rather than against a
   * fixed threshold. `undefined` keeps `HOT_TODAY_MIN`, which is what the wall
   * ships with — this is opt-in, and only `/preview` opts in today.
   */
  todayTone?: 'up' | 'down'
}) {
  const hot = team.todayRevenue >= HOT_TODAY_MIN
  /**
   * Two ways to read the same figure, and only one is ever on.
   *
   * The wall's rule is a fixed threshold: a strong day is ₹5,000, full stop, and
   * a team knows what it has to beat. `todayTone` replaces it with a relative
   * one — above or below the cohort's own average today — which says something
   * different: not "was this a good day" but "was this a better day than the
   * room". Both are defensible; running both at once would be two emphases,
   * which is one more than this board allows.
   */
  const toneColour =
    todayTone === undefined ? undefined : todayTone === 'up' ? UP : DOWN
  const flips = cue !== undefined && cue.role !== 'slide'
  // `false`, not `undefined`, for a card with no cue: the reset to x/y 0 has to
  // land in the same commit as the settle's re-slot, or the board would be seen
  // reordering under a card that had already finished moving.
  const travel = cue === undefined ? { animate: { x: 0, y: 0, scale: 1 }, transition: { duration: 0 } } : travelMotion(cue)
  const base =
    cue === undefined ? {} : flips ? baseMotion(cue) : slideBaseMotion(cue)

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
      // The cell is what starts at the row's top; `.tv-card` is now only the
      // base at its bottom, and measuring that reported 207px of header
      // clearance on a grid whose real top was 24px below it.
      className="tv-card-cell"
      // The brain reads cell geometry by rank when a flip starts. Untransformed
      // layout only — `getBoundingClientRect` on a cell is safe because cells
      // never move; it is the disc inside them that does.
      data-rank={rank}
      style={{
        height: '100%',
        position: 'relative',
        // A card in a flip paints over its neighbours. Without this the disc
        // crosses *under* the cards it is passing, which reads as the board
        // swallowing it rather than as one card overtaking another.
        ...(cue === undefined ? {} : { zIndex: 3 }),
      }}
    >
      {/* Board apparatus, not the team's — see the note on `.tv-rank-anchor`.

          The top three carry the supplied display numerals; everyone else gets
          the same number in type. That split is the point: three cards on this
          board are the story, and giving all forty the display treatment would
          say nothing at all. */}
      <div className="tv-rank-anchor">
        {rank <= 3 ? (
          <span
            className="tv-rank-glyph"
            role="img"
            aria-label={`Rank ${rank}`}
            style={{
              maskImage: `url(/ranks/${rank}.png)`,
              WebkitMaskImage: `url(/ranks/${rank}.png)`,
            }}
          />
        ) : (
          <span className="tv-rank-plain">{rank}</span>
        )}
      </div>

      {/* The disc, centred over the base and lifted clear of it. Its bottom sits
          `--s-card-lift` above the base's top edge — small, because the shadow
          is what says "floating" and distance on its own just reads as a gap. */}
      <motion.div
        {...travel}
        // The travel is the longest-running property in the sequence, so its
        // completion is the sequence's. Component-level, not transition-level:
        // the old kick measured the per-transition `onComplete` never firing at
        // all once the transition carried per-property overrides, which wedged
        // the queue with nothing on screen progressing.
        onAnimationComplete={attacker ? onSettled : undefined}
        className="tv-disc-travel"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `calc(var(--h-card-text) + var(--s-card-lift))`,
          display: 'grid',
          placeItems: 'center',
          // **On the disc's direct parent, not on the cell.** `perspective`
          // applies only to an element's own children, so one level further up
          // it does nothing and the look-down renders orthographically — a flat
          // squash rather than a mark tipping its face forward. Measured while
          // it sat on the cell: the disc's height was exactly cos(30°) of its
          // width, which is the signature of no perspective at all. `/podium`
          // carries the same note for the same reason.
          perspective: '900px',
        }}
      >
        <VentureDisc
          team={team}
          idle={idle}
          delaySeconds={delaySeconds}
          {...(flips ? { flipShift: cue.shift } : {})}
        />
      </motion.div>

      {/* The base. This is the card now — the fill, the border and the radius
          are all here rather than around the whole cell. */}
      <motion.div
        className="tv-card"
        {...base}
        style={{
          transformOrigin: 'top center',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 'var(--h-card-text)',
          display: 'grid',
          gridTemplateRows: 'auto auto auto',
          alignContent: 'center',
          justifyItems: 'center',
          gap: 'calc(var(--s-1) / 2)',
          minWidth: 0,
          paddingInline: 'var(--s-card-inset)',
        }}
      >
        {/* **No venture name.** It was removed deliberately: at this card size the
            name was the widest thing in the base and forced a marquee on every
            long one, and the mark above it already says whose card this is far
            faster than a word does at six metres. `VentureName` and its paging
            survive for whatever needs them next; nothing on this board does.

            The one thing lost with it is the fallback identity for a team with
            no artwork *and* no name — those cards now read only as a tinted
            initial. `SLE-C422` and `SLE-C435` were exactly that case and both
            have logos now, so the board currently has none. */}
        {/* The figure the board exists to show, and the largest thing on the
            card. Blank, never ₹0: in week 4 only sixteen of forty teams have
            sold anything this week, and forty identical zeroes would teach the
            eye to skip the column that matters. */}
        <div className="tv-figure" style={{ font: 'var(--t-tv-card-week)', color: 'var(--fg1)' }}>
          {team.weekRevenue > 0 ? formatRupees(team.weekRevenue) : '—'}
        </div>

        {/* Today, carrying the wall's one emphasis.

            **Labelled, because the card has no column headings.** The list this
            replaced put "This week" and "Today" above the two figure columns; a
            card has nowhere to put them, so two bare rupee amounts on one card
            would give a passer-by no way to know which is which.

            It appears only when there is a figure. A permanent "TODAY" caption
            over an empty line is apparatus describing absence, and on a quiet
            morning it would be describing it on all forty cards. */}
        <div
          className="tv-figure"
          style={{
            font:
              toneColour !== undefined || hot
                ? 'var(--t-tv-card-today-hot)'
                : 'var(--t-tv-card-today)',
            color: toneColour ?? (hot ? HOT : 'var(--fg-muted)'),
            // Reserved whether or not there is a figure, so the week revenue
            // sits on one line across all forty cards instead of dropping half a
            // line on the teams that have not traded today.
            minHeight: '1em',
            display: 'flex',
            alignItems: 'baseline',
            gap: 'calc(var(--s-1) * 0.75)',
          }}
        >
          {team.todayRevenue > 0 && (
            <>
              <span
                style={{
                  font: 'var(--t-tv-card-label)',
                  letterSpacing: 'var(--track-overline)',
                  textTransform: 'uppercase',
                  color: 'var(--fg-muted)',
                }}
              >
                Today
              </span>
              {formatRupees(team.todayRevenue)}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
