/**
 * One stable number per team, for everything that must look arbitrary but
 * never change.
 *
 * A venture's mark colour and the way its mark idles on the podium are both
 * drawn from this. Both have the same requirement: spread the cohort out, and
 * give the same team the same answer forever. Assigned by rank instead, a
 * venture would change colour *and* change how it moves the moment it was
 * overtaken — and a mark that changes on promotion reads as a different
 * venture.
 *
 * **The exact arithmetic is load-bearing.** It was lifted verbatim out of
 * `VentureLogo.tintFor`, where it used to live inline, and it already decides
 * all 42 tints on a wall people have been looking at. Changing the constant or
 * the accumulation would silently reassign every colour on the board.
 */
export function hashTeamId(teamId: string): number {
  let hash = 0
  for (let index = 0; index < teamId.length; index += 1) {
    hash = (hash * 31 + teamId.charCodeAt(index)) >>> 0
  }
  return hash
}
