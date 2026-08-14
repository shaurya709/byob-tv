/**
 * What the green mark on a card means, in the corner of the board.
 *
 * ── Why the board needs a legend at all ──
 *
 * Every other element on this wall explains itself: a venture name is a name, a
 * rupee figure is money, a rank is a rank. The green triangle is the one mark
 * that carries meaning by convention rather than by being what it is, and the
 * convention is this board's own — nobody arrives knowing it. One line in the
 * corner is cheaper than the alternative, which is a passer-by deciding it must
 * mean something it does not.
 *
 * ── It sits in the frame's own margin, not in the grid ──
 *
 * Absolutely positioned against the board's padding box, so it takes no height
 * from the four rows and cannot move a card. That margin is 25.8px at 1920 and
 * the legend is set well inside it; if the grid ever grows to claim that space,
 * this is the thing that gets clipped rather than the thing that pushes the
 * board off the frame.
 *
 * The mark is `VentureCard`'s own class, not a copy of it, so a change to the
 * triangle's shape or size reaches the legend automatically. Two drawings of
 * one symbol is how a legend starts lying about what it explains.
 */
export function BoardLegend() {
  return (
    <p className="tv-legend">
      <span className="tv-day-mark tv-legend-mark" aria-hidden="true" />
      Today&rsquo;s revenue
    </p>
  )
}
