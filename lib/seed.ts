/**
 * One stable number per team, for everything that must look arbitrary but
 * never change.
 *
 * A venture's mark colour is drawn from this: spread the cohort out, and give
 * the same team the same answer forever. Assigned by rank instead, a venture
 * would change colour the moment it was overtaken, and a mark that changes on
 * promotion reads as a different venture.
 *
 * The podium's idle timelines deliberately do *not* use this — see `idleOf` in
 * components/Podium.tsx for why a hash is the wrong tool for choosing three
 * things that must differ from each other.
 *
 * **The exact arithmetic is load-bearing.** It was lifted verbatim out of
 * `VentureLogo.tintFor`, where it used to live inline, and it already decides
 * all 42 tints on a wall people have been looking at. Changing the constant or
 * the accumulation would silently reassign every colour on the board.
 *
 * **Do not take a small modulo of this.** The multiplier is 31 and 31 ≡ 1
 * (mod 3), so `hash % 3` degenerates into "the sum of the character codes, mod
 * 3" — and all 42 ids are `SLE-C4` plus two digits, which leaves the bucket
 * decided by the digit sum alone. Measured on the running wall: three teams
 * sharing a bucket is ordinary rather than unlucky. `% 6` for the tints is
 * safe enough in practice because the sums spread over six, but anything
 * smaller needs an avalanche step first.
 */
export function hashTeamId(teamId: string): number {
  let hash = 0
  for (let index = 0; index < teamId.length; index += 1) {
    hash = (hash * 31 + teamId.charCodeAt(index)) >>> 0
  }
  return hash
}
