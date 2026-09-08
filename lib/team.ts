/**
 * A venture's name, or its ID.
 *
 * Placeholder names are already blanked at the parse layer (`lib/feed.ts`), so
 * an unnamed team arrives here with an empty string and carries its team ID
 * rather than a gap. `AGENTS.md` is explicit that such a team competes and fires
 * triggers like any other — the wall celebrates `SLE-C407` by name-or-ID rather
 * than not at all.
 *
 * **Shared, not copied.** It lived privately inside `components/Podium.tsx`
 * until `/weekly`'s cards started printing names too. Two boards in one rotation
 * disagreeing about what an unnamed team is called — one showing an ID, the
 * other a blank — is exactly the kind of quiet inconsistency that runs for weeks
 * on a wall nobody is actively watching.
 *
 * **Typed on the two fields it reads, not on `Team`.** The market board's rows
 * are a different shape from a different spreadsheet, and they need the same
 * name-or-ID rule for the same reason — a third board disagreeing about what an
 * unnamed stall is called would be the same quiet inconsistency one layer down.
 * A structural parameter shares the rule without pretending the two rows are
 * the same thing, which `lib/marketTypes.ts` is at pains to keep apart.
 */
export function nameOf(team: { ventureName: string; teamId: string }): string {
  return team.ventureName || team.teamId
}
