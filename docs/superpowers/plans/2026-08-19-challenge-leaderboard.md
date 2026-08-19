# Two-Week Challenge Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/weekly` ranks and prints each team's revenue since the challenge baseline instead of its revenue this week, and its band counts the challenge day instead of the Mesa Flea.

**Architecture:** Six additive changes. A new optional `challenge_revenue` column joins the `Team` type, a new comparator ranks on it, `BoardSpec` gains an optional `period` accessor so `/weekly` can tell `detect()` that a *challenge* rollover is the reset to stay quiet through, and three `/weekly`-only components change what they print. Nothing is renamed and nothing is deleted, so `/podium` is untouched by construction.

**Tech Stack:** Next.js 16 (static, client-rendered), React 19, TypeScript, vitest, papaparse.

**Spec:** `docs/superpowers/specs/2026-08-19-challenge-leaderboard-design.md`

## Global Constraints

- **Only `/weekly` changes.** `/podium` uses `PodiumMasthead`, `rankTeams` and `lib/climber.ts`; none of them appear in this plan. `lib/climber.ts` and `components/MoverPanel.tsx` keep using `weekRevenue` — that panel is still weekly and is correct as it stands.
- **No backend.** No API routes, no serverless functions, no database. Two published CSVs fetched from the browser.
- **Never hardcode a hex.** No new colour enters this work at all.
- **No new trigger types.** The 15 in the design are the whole list.
- **No date literals in source.** Every date and day number derives from `challenge_start_iso` / `challenge_end_iso`. A literal here is wrong on 1 September.
- **Currency is `Intl.NumberFormat('en-IN')`** via the existing `formatRupees`. Never a bare template string.
- **The sheet is already live and correct.** `challenge_revenue` and the three `TV_Cohort` keys publish today — verified 19 Aug. No sheet work remains.
- **Verification per `README.md`:** `npm run typecheck`, `npm run test`, `npm run lint`, `npm run build`. Layout is verified by measuring the running app at 1920 × 1080, never by reading source.
- **Reintroduce the bug first.** Every test below must be seen to fail for the right reason before the implementation lands.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `lib/types.ts` | Shared types | Add `challengeRevenue` to `Team` |
| `lib/feed.ts` | CSV → `Snapshot`, and the sheet contract | Parse the optional column; add two cohort readers |
| `lib/ranking.ts` | Ordering, and who is competing | Add `compareChallenge` / `rankByChallenge` |
| `lib/useWallData.ts` | Visibility-gated polling | `BoardSpec` gains optional `period` |
| `lib/challenge.ts` | **new** — which day of the challenge it is | Pure; no DOM, no storage |
| `app/weekly/page.tsx` | `/weekly`'s board spec and composition | Rank on the challenge figure; new label and legend |
| `components/WeeklyGrid.tsx` | The 4 × 10 grid | `rowsOf` sorts on the challenge figure |
| `components/VentureCard.tsx` | One team's card | Print the challenge figure, negatives included |
| `lib/format.ts` | Rupee and rank rendering | Stop `-0` rendering as `-₹0` |
| `components/BoardLegend.tsx` | What the marks mean | Accept and print the window |
| `components/WallHeader.tsx` | `/weekly`'s band | Challenge day replaces the Flea strip |
| `components/ChallengeDay.tsx` | **new** — "Day 2 of 14" | Owns the interval and the mounted guard |
| `lib/devOvertake.ts` | Dev-only fake overtakes | Move the fake figure to `challengeRevenue` |

---

### Task 1: `challenge_revenue` reaches the `Team` type

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/feed.ts:82-104`
- Test: `lib/feed.test.ts`

**Interfaces:**
- Produces: `Team.challengeRevenue: number` — always present, `0` when the sheet does not publish the column.

**Why optional rather than required:** every name in `FEED_HEADERS` is required and a missing one discards the whole fetch. Reading `challenge_revenue` outside that list is what lets this ship against a sheet mid-edit, and it is exactly the pattern `prev_week_rank` already uses. Do **not** add it to `FEED_HEADERS`.

- [ ] **Step 1: Write the failing tests**

Add to `lib/feed.test.ts`:

```ts
it('reads challenge_revenue, including a negative one', () => {
  const csv = [
    'team_id,venture_name,total_revenue,week_revenue,today_revenue,total_units,challenge_revenue',
    'SLE-C401,Dosa Crisps,57826,0,0,236,"-3,850"',
    'SLE-C402,ROOH,37830,3190,0,108,"3,190"',
  ].join('\n')
  expect(parseTeams(csv)[0]).toMatchObject({ teamId: 'SLE-C401', challengeRevenue: -3_850 })
  expect(parseTeams(csv)[1]).toMatchObject({ teamId: 'SLE-C402', challengeRevenue: 3_190 })
})

it('defaults challenge_revenue to 0 when the sheet has not grown the column', () => {
  const csv = [
    'team_id,venture_name,total_revenue,week_revenue,today_revenue,total_units',
    'SLE-C401,Dosa Crisps,57826,0,0,236',
  ].join('\n')
  expect(parseTeams(csv)[0]).toMatchObject({ challengeRevenue: 0 })
})
```

The quoted `"-3,850"` is not decoration — it is exactly what Google publishes, verified against the live CSV on 19 August. A test using `-3850` would pass while the thousands separator broke the wall.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/feed.test.ts -t challenge_revenue`
Expected: FAIL — `challengeRevenue` is `undefined`.

- [ ] **Step 3: Add the field to `Team`**

In `lib/types.ts`, inside `Team`, after `totalUnits`:

```ts
  /**
   * Revenue banked since the current challenge's baseline was photographed —
   * `total_revenue` minus a frozen snapshot of itself, computed in the sheet.
   *
   * **Ranks `/weekly`.** `weekRevenue` is still published and still correct; it
   * simply is not what this board is about any more.
   *
   * **Legitimately negative.** A baseline is a photograph of a *proof-gated*
   * figure, and proof can be revoked after the shutter closes: a sale logged
   * before the baseline that later has its proof set to `No` shrinks the
   * all-time total while the photograph still shows the larger number. Three
   * teams were in this state on 19 August. Nothing clamps it — the comparator
   * sorts the true value and the card prints it, so a team that went backwards
   * says so from the bottom of the board.
   *
   * `0` when the sheet has not published the column — read optionally, like
   * `prevWeekRank`, so the wall works before the column exists.
   */
  challengeRevenue: number
```

- [ ] **Step 4: Parse it**

In `lib/feed.ts`, in `toTeam`, add to the returned object after `totalUnits`:

```ts
    // `?? 0` rather than a null-check that drops the row: an unreadable
    // optional column must not discard a row the required six columns fully
    // describe. The row gate judges whether a *fetch* is trustworthy, and it
    // cannot judge what never reaches it.
    challengeRevenue: toNumber(row.challenge_revenue ?? '') ?? 0,
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run lib/feed.test.ts`
Expected: PASS, and every pre-existing test in the file still passes.

- [ ] **Step 6: Fix the type errors this surfaces**

`Team` gained a required field, so every test fixture that builds a `Team` literal now fails to typecheck.

Run: `npm run typecheck`

Add `challengeRevenue: 0` to each fixture the compiler names. Start with the shared one — `test/fixtures.ts`, which `teams()` comes from and which several test files build on — then the inline `Team` literals in `lib/climber.test.ts`, `lib/overtake.test.ts`, `lib/ranking.test.ts`, `lib/useWallData.test.tsx` and `components/render.test.tsx`. Do not change any other value in those fixtures — they are testing behaviour this task does not touch.

- [ ] **Step 7: Commit**

```bash
git add lib/types.ts lib/feed.ts lib/feed.test.ts test/fixtures.ts lib/*.test.ts* components/render.test.tsx
git commit -m "The feed carries each team's challenge revenue"
```

---

### Task 2: The comparator that ranks a challenge

**Files:**
- Modify: `lib/ranking.ts`
- Test: `lib/ranking.test.ts`

**Interfaces:**
- Consumes: `Team.challengeRevenue` from Task 1.
- Produces: `compareChallenge(a: Team, b: Team): number` and `rankByChallenge(teams: readonly Team[]): Team[]`.

- [ ] **Step 1: Write the failing tests**

Add to `lib/ranking.test.ts`:

```ts
describe('rankByChallenge', () => {
  it('ranks on challenge revenue, then all-time, then team id', () => {
    const ranked = rankByChallenge(
      teams([
        { teamId: 'SLE-C401', challengeRevenue: 4_000, totalRevenue: 10_000 },
        { teamId: 'SLE-C402', challengeRevenue: 9_000, totalRevenue: 9_000 },
        { teamId: 'SLE-C403', challengeRevenue: 4_000, totalRevenue: 80_000 },
      ]),
    )
    expect(ranked.map((team) => team.teamId)).toEqual(['SLE-C402', 'SLE-C403', 'SLE-C401'])
  })

  it('sorts a team below its baseline beneath a team that simply has not traded', () => {
    const ranked = rankByChallenge(
      teams([
        { teamId: 'SLE-C401', challengeRevenue: -3_850, totalRevenue: 57_826 },
        { teamId: 'SLE-C402', challengeRevenue: 0, totalRevenue: 12_075 },
      ]),
    )
    expect(ranked.map((team) => team.teamId)).toEqual(['SLE-C402', 'SLE-C401'])
  })

  it('is a total order on day one, when every team is on zero', () => {
    const day1 = teams(
      Array.from({ length: 42 }, (_, i) => ({
        teamId: `SLE-C4${String(i + 1).padStart(2, '0')}`,
        challengeRevenue: 0,
        totalRevenue: 0,
      })),
    )
    const once = rankByChallenge(day1).map((team) => team.teamId)
    const again = rankByChallenge([...day1].reverse()).map((team) => team.teamId)
    expect(again).toEqual(once)
  })
})
```

Use whatever `teams(...)` fixture helper `lib/ranking.test.ts` already defines; match the existing `rankByWeek` describe block above it rather than inventing a new shape.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/ranking.test.ts -t rankByChallenge`
Expected: FAIL — `rankByChallenge is not a function`.

- [ ] **Step 3: Write the comparator**

In `lib/ranking.ts`, after `compareWeek` / `rankByWeek`:

```ts
/**
 * This challenge's standing: challenge revenue desc → **all-time** revenue desc
 * → team ID asc.
 *
 * All-time revenue is the second key for the reason `compareWeek` gives, and
 * the reason survives the change of first key intact: day one of a challenge
 * has every team on ₹0, and falling back to the standing the wall showed all of
 * last fortnight is the reading a passer-by already has in their head. Ordering
 * forty zeroes by team ID would look arbitrary, and would make `/weekly`
 * disagree with `/podium` for no reason anyone could see.
 *
 * **A total order, like every comparator in this file.** On the morning a
 * challenge opens, forty teams sit on ₹0 — and an order that can shuffle
 * between two identical fetches is indistinguishable from forty teams
 * overtaking each other.
 *
 * **Sorts the true value, including a negative one.** A team below its baseline
 * belongs beneath a team that has simply not traded, and its card prints the
 * negative rather than hiding it. Nothing is clamped, here or at the card —
 * clamping either would collapse the two into a tie.
 */
export function compareChallenge(a: Team, b: Team): number {
  if (b.challengeRevenue !== a.challengeRevenue) return b.challengeRevenue - a.challengeRevenue
  if (b.totalRevenue !== a.totalRevenue) return b.totalRevenue - a.totalRevenue
  return a.teamId.localeCompare(b.teamId)
}

export function rankByChallenge(teams: readonly Team[]): Team[] {
  return [...teams].sort(compareChallenge)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/ranking.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ranking.ts lib/ranking.test.ts
git commit -m "A comparator that ranks a challenge"
```

---

### Task 3: The board says which period it is in

**Files:**
- Modify: `lib/feed.ts`
- Modify: `lib/useWallData.ts:43-49` and `:145-151`
- Test: `lib/feed.test.ts`

**Interfaces:**
- Produces: `currentChallenge(cohort: Cohort): number | null`; `BoardSpec.period?: (cohort: Cohort) => number | null`.

**The whole point of this task.** `detect()` goes silent when the period changes, because that is the tick where every figure on the board resets to zero at once. Today that period is the programme week, and for a challenge delta the week is wrong in *both* directions: it changes on Monday 24 August when nothing resets, and it does *not* change on Tuesday 1 September when everything does.

**Deliberately not renamed.** `BoardState.week` keeps its name and its shape. Renaming it would change what every TV has in `localStorage` and force a storage key version bump. Leaving it means each wall's stored `week: 5` meets the new `period: 1` on the first poll after deploy, the guard fires once, the wall records what it sees and animates nothing — which is the seeding behaviour we want, for free.

- [ ] **Step 1: Write the failing tests**

Add to `lib/feed.test.ts`:

```ts
describe('currentChallenge', () => {
  it('reads the challenge number', () => {
    expect(currentChallenge({ current_challenge: '1' })).toBe(1)
    expect(currentChallenge({ current_challenge: '2' })).toBe(2)
  })

  it('is null when the sheet has not said', () => {
    expect(currentChallenge({})).toBeNull()
    expect(currentChallenge({ current_challenge: '' })).toBeNull()
    expect(currentChallenge({ current_challenge: 'first' })).toBeNull()
    expect(currentChallenge({ current_challenge: '0' })).toBeNull()
  })
})

describe('cohortInstant', () => {
  it('reads an instant that carries an offset', () => {
    const at = cohortInstant({ challenge_start_iso: '2026-08-18T00:00:00+05:30' }, 'challenge_start_iso')
    expect(at?.toISOString()).toBe('2026-08-17T18:30:00.000Z')
  })

  it('refuses an instant with no offset', () => {
    expect(cohortInstant({ challenge_start_iso: '2026-08-18T00:00:00' }, 'challenge_start_iso')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/feed.test.ts -t currentChallenge`
Expected: FAIL — `currentChallenge is not a function`.

- [ ] **Step 3: Add the readers**

In `lib/feed.ts`, beside `openWeek`:

```ts
/**
 * Which two-week challenge is open, or `null` if the sheet has not said.
 *
 * This is `/weekly`'s answer to the question `current_open_week` answers for a
 * weekly board: *did the figure this board ranks on just reset to zero for
 * everyone at once?* The two are different clocks and always will be —
 * challenges run Tuesday→Monday and programme weeks run Monday→Sunday, so week
 * 7 spans both the end of challenge 1 and the start of challenge 2.
 *
 * Read optionally, and **not** in `COHORT_KEYS`: a missing key there throws away
 * the whole fetch, and this one is allowed to be absent while the sheet is
 * mid-edit. `null` behaves exactly as a wall with no stored state does — it
 * records what it sees and animates nothing.
 */
export function currentChallenge(cohort: Cohort): number | null {
  const raw = (cohort.current_challenge ?? '').trim()
  if (raw === '') return null
  const value = Number(raw)
  return Number.isInteger(value) && value >= 1 ? value : null
}
```

Then generalise the instant parser. Replace the body of `fleaInstant` so both callers share one rule — the offset requirement is the load-bearing part and must not exist in two copies:

```ts
/**
 * An absolute instant from a `TV_Cohort` cell, or `null`.
 *
 * **The offset is mandatory.** `new Date('2026-08-18T00:00:00')` — no offset —
 * is parsed in the *browser's* timezone, so a laptop set to anything but IST
 * computes a different day boundary and looks completely healthy doing it.
 * Requiring `+05:30` is what makes every derived figure a difference between two
 * absolute instants, correct on any machine whose clock is right.
 */
export function cohortInstant(cohort: Cohort, key: string): Date | null {
  const raw = (cohort[key] ?? '').trim()
  if (!ABSOLUTE_INSTANT.test(raw)) return null
  const at = new Date(raw)
  return Number.isFinite(at.getTime()) ? at : null
}

/** When the Mesa Flea opens, or `null`. `null` renders as no countdown at all. */
export function fleaInstant(cohort: Cohort): Date | null {
  return cohortInstant(cohort, 'flea_datetime_iso')
}
```

Keep `fleaInstant`'s existing docblock above it; it explains why `null` is a legible state and `/podium` still depends on that behaviour.

- [ ] **Step 4: Let a board choose its own period**

In `lib/useWallData.ts`, add to `BoardSpec` after `watchTo`:

```ts
  /**
   * What counts as "the period this board's figure resets with", read off the
   * cohort. Defaults to the programme week.
   *
   * `/weekly` overrides it with `currentChallenge`, because its figure resets
   * when a challenge rolls over rather than on a Monday. `/podium` leaves it
   * alone and is unaffected.
   */
  period?: (cohort: Cohort) => number | null
```

Import `Cohort` from `@/lib/types` alongside the existing type imports.

Then at the `detect` call:

```ts
      const { name, rank, earned, watchTo, period = openWeek } = board
      const { state, events } = detect(readBoard(name), {
        ranked: rank(fresh.teams),
        week: period(fresh.cohort),
        watchTo,
        earned,
      })
```

`DetectInput.week` keeps its name. It was never about weeks — it is "the period this board's figure resets with" — but renaming it changes the stored `BoardState` shape and buys nothing this change needs.

- [ ] **Step 5: Run the full suite**

Run: `npm run test && npm run typecheck`
Expected: PASS. `/podium` and every existing test take the `openWeek` default and behave identically.

- [ ] **Step 6: Commit**

```bash
git add lib/feed.ts lib/feed.test.ts lib/useWallData.ts
git commit -m "A board chooses the period its figure resets with"
```

---

### Task 4: `/weekly` ranks on the challenge

**Files:**
- Modify: `app/weekly/page.tsx:11,33-40`
- Modify: `components/WeeklyGrid.tsx:7,79`
- Modify: `components/DevFlipTrigger.tsx:4,69`
- Modify: `lib/devOvertake.ts:41-90`
- Test: `lib/overtake.test.ts`

**Interfaces:**
- Consumes: `rankByChallenge` (Task 2), `currentChallenge` (Task 3), `Team.challengeRevenue` (Task 1).

**Three sort sites, not one.** `rowsOf` in `WeeklyGrid` re-sorts independently of the page's spec, and `DevFlipTrigger` sorts again to pick a victim. Miss either and the board renders in one order while `detect` reasons about another — which looks completely correct until an overtake animates the wrong two cards.

- [ ] **Step 1: Write the failing tests**

Add to `lib/overtake.test.ts`, beside the existing `board` / `run` helpers at the top of the file:

```ts
/** The same shape as `board`, scored the way `/weekly` now scores. */
function challengeBoard(overrides: Partial<Team>[] = []): Team[] {
  return teams(overrides).map((team, index) => ({
    ...team,
    challengeRevenue: team.challengeRevenue || 1_000 * (42 - index),
    totalRevenue: team.totalRevenue || 1_000 * (42 - index),
  }))
}

/** `run`, ranked and scored the way `/weekly`'s spec now does. */
function runChallenge(
  prev: BoardState | null,
  rows: readonly Team[],
  challenge: number | null = 1,
) {
  return detect(prev, {
    ranked: rankByChallenge(rows),
    week: challenge,
    watchTo: WATCH_RANKS_WEEKLY,
    earned: (team) => team.challengeRevenue,
  })
}
```

Then the tests:

```ts
describe('a challenge board', () => {
  it('speaks when a team climbs inside an open challenge', () => {
    const before = runChallenge(null, challengeBoard()).state
    const { events } = runChallenge(
      before,
      challengeBoard([{ teamId: 'SLE-C410', challengeRevenue: 41_500 }]),
    )
    expect(events.length).toBeGreaterThan(0)
  })

  it('goes quiet when the challenge number rolls over', () => {
    const before = runChallenge(null, challengeBoard(), 1).state
    const { events } = runChallenge(
      before,
      challengeBoard([{ teamId: 'SLE-C410', challengeRevenue: 41_500 }]),
      2,
    )
    expect(events).toEqual([])
  })

  it('is silent through a whole-board reset, then speaks for the first real climb', () => {
    const before = runChallenge(null, challengeBoard(), 1).state
    // Every figure drops to zero together. Nobody's figure went up, so nothing fires.
    const reset = runChallenge(
      before,
      challengeBoard(teams().map((t) => ({ teamId: t.teamId, challengeRevenue: 0 }))),
      2,
    )
    expect(reset.events).toEqual([])
  })
})
```

And the wiring assertion — the actual regression risk is somebody restoring the `openWeek` default. Add to `components/render.test.tsx` (or a new `app/weekly/board.test.ts`):

```ts
import { BOARD } from '@/app/weekly/page'
import { currentChallenge } from '@/lib/feed'

it('/weekly resets with the challenge, not with the programme week', () => {
  expect(BOARD.period).toBe(currentChallenge)
  expect(BOARD.earned({ ...team(), challengeRevenue: 4_200 })).toBe(4_200)
})
```

This requires `export const BOARD` in `app/weekly/page.tsx` — Next reserves only `default`, `metadata` and the route-segment config names, so a named export is safe.

**Why this assertion earns its place:** with `period` left at its default the wall goes deaf to real overtakes every Monday and stays talkative through the one tick where forty figures drop to zero. Both failures look like "nothing happened", which is indistinguishable from a quiet afternoon on a wall nobody is watching.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/overtake.test.ts -t "challenge board"`
Expected: FAIL — `rankByChallenge` is not imported in that file yet, then `challengeRevenue` is `undefined` on the fixtures.

Run: `npx vitest run components/render.test.tsx -t "resets with the challenge"`
Expected: FAIL — `BOARD` is not exported.

- [ ] **Step 3: Point the page's spec at the challenge**

In `app/weekly/page.tsx`, change the import and the spec:

```ts
import { currentChallenge } from '@/lib/feed'
import { competingTeams, rankByChallenge } from '@/lib/ranking'
```

```ts
// Exported so a test can assert the `period` wiring — see Task 4 Step 1.
export const BOARD: BoardSpec = {
  name: 'weekly',
  rank: (teams) => rankByChallenge(competingTeams(teams)),
  earned: (team) => team.challengeRevenue,
  watchTo: WATCH_RANKS_WEEKLY,
  // **Not `openWeek`.** This board's figure resets when a challenge rolls over,
  // which is a Tuesday, and not on the Monday a programme week turns. Left at
  // the default the wall would go deaf to real overtakes every Monday and stay
  // talkative through the one tick where forty figures drop to zero together.
  period: currentChallenge,
}
```

Keep the existing `openWeek` import and the `const week = ...` line — `DevFlipTrigger` still stamps the week into a dev event id and nothing else depends on it.

- [ ] **Step 4: Point the grid's sort at the challenge**

In `components/WeeklyGrid.tsx`, change the import to `rankByChallenge` and, in `rowsOf`:

```ts
export function rowsOf(teams: readonly Team[]): Team[][] {
  const ranked = rankByChallenge(teams)
  return ROW_HEIGHTS.map((_, i) => ranked.slice(i * ROW_LENGTH, (i + 1) * ROW_LENGTH))
}
```

- [ ] **Step 5: Point the dev trigger at the challenge**

In `components/DevFlipTrigger.tsx`, change the import to `rankByChallenge` and line 69 to `const ranked = rankByChallenge(teams)`.

In `lib/devOvertake.ts`, rename the faked field throughout from `weekRevenue` to `challengeRevenue` — the `pending` array's shape, `ceiling`, `gap`, the `pending.push`, the `next.set` and the spread at the end. This is development-only scaffolding for watching a flip; if it keeps writing `weekRevenue` the board it fakes a climb on no longer sorts on that field and the trigger silently does nothing.

- [ ] **Step 6: Run the suite**

Run: `npm run test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/weekly/page.tsx components/WeeklyGrid.tsx components/DevFlipTrigger.tsx lib/devOvertake.ts lib/useWallData.test.tsx
git commit -m "/weekly ranks on the challenge, and resets with it"
```

---

### Task 5: The card prints the challenge figure, negatives and all

**Files:**
- Modify: `components/VentureCard.tsx:336`
- Modify: `lib/format.ts:30-32`
- Test: `components/render.test.tsx`
- Test: `lib/format.test.ts` (create if absent)

**Interfaces:**
- Consumes: `Team.challengeRevenue` (Task 1).

**Nothing is clamped.** A team below its baseline prints its real figure and sits where `compareChallenge` already puts it — the bottom of the board. The only change beyond the field name is a rounding bug in `formatRupees`.

- [ ] **Step 1: Write the failing tests**

In `components/render.test.tsx`, add:

```ts
it('prints the challenge figure', () => {
  const text = render(<VentureCard team={team({ challengeRevenue: 16_141 })} rank={7} />)
  expect(text).toContain(formatRupees(16_141))
})

it('prints a team below its baseline in full', () => {
  const text = render(<VentureCard team={team({ challengeRevenue: -3_850 })} rank={38} />)
  expect(text).toContain('-₹3,850')
})
```

And in `lib/format.test.ts`:

```ts
describe('formatRupees', () => {
  it('keeps a real negative', () => {
    expect(formatRupees(-3_850)).toBe('-₹3,850')
    expect(formatRupees(-1.5)).toBe('-₹1')
  })

  it('never signs a value that rounds to zero', () => {
    expect(formatRupees(-0.5)).toBe('₹0')
    expect(formatRupees(-0.4)).toBe('₹0')
    expect(formatRupees(0)).toBe('₹0')
  })
})
```

The second test is not hypothetical, and the mechanism is not the obvious one: `Math.round(-0.5)` is **negative zero**, and `Intl.NumberFormat` faithfully renders its sign. One team was at exactly −₹0.50 on 19 August.

Then update the existing tests in `components/render.test.tsx` that assert on `weekRevenue`: lines ~268, ~277-279, ~319, ~333, ~391, ~404, ~418, ~424, ~429, ~441, ~477, ~487. Each becomes `challengeRevenue`. Do not change the numbers or the assertions — they are testing the card's quiet/solid treatment and its two figure lines, which this task does not alter.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/render.test.tsx -t challenge`
Expected: FAIL — the card still prints `weekRevenue`.

Run: `npx vitest run lib/format.test.ts -t "rounds to zero"`
Expected: FAIL with `expected '-₹0' to be '₹0'`. If it passes, the bug is not reproduced and the fix below is unverified — stop and find out why before continuing.

- [ ] **Step 3: Point the card at the challenge figure**

In `components/VentureCard.tsx`, replace the figure line:

```tsx
          {formatRupees(team.challengeRevenue)}
```

And extend the docblock above it:

```tsx
        {/* The figure the board exists to show, **on every card, including a
            challenge of zero and a challenge below zero**.
            …existing paragraphs unchanged…

            **A negative prints as a negative.** A team can sit below its
            baseline — proof revoked on a sale logged before the photograph was
            taken — and `-₹3,850` is what happened. The board's own ordering
            already says the same thing: `compareChallenge` sorts the true
            value, so such a team is at the bottom rather than tied with the
            teams that simply have not traded. Nothing is clamped here or
            anywhere else. */}
```

- [ ] **Step 4: Fix the negative-zero rounding**

In `lib/format.ts`:

```ts
export function formatRupees(value: number): string {
  // `|| 0`, not a comparison: `Math.round(-0.5)` is **negative zero**, which
  // `Intl.NumberFormat` faithfully renders as `-₹0` — and `-0 === 0` is `true`,
  // so a comparison cannot catch it. At whole-rupee precision the value *is*
  // zero, so the sign describes precision that was already discarded, and a
  // minus in front of a zero on a wall reads as a fault rather than a fact.
  //
  // Every real negative passes through untouched. Reached only by `/weekly`'s
  // challenge figure; every figure `/podium` prints is a non-negative total.
  return RUPEES.format(Math.round(value) || 0)
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run lib/format.test.ts components/render.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/VentureCard.tsx lib/format.ts lib/format.test.ts components/render.test.tsx
git commit -m "The card prints the challenge figure, negatives and all"
```

---

### Task 6: The band counts the challenge, and the legend names the window

**Files:**
- Create: `lib/challenge.ts`
- Create: `lib/challenge.test.ts`
- Create: `components/ChallengeDay.tsx`
- Modify: `components/WallHeader.tsx`
- Modify: `components/BoardLegend.tsx`
- Modify: `app/weekly/page.tsx`

**Interfaces:**
- Consumes: `cohortInstant` (Task 3).
- Produces: `challengeDay(start: Date | null, end: Date | null, now: number): { day: number; total: number } | null`; `baselineLabel(start: Date | null): string | null`.

**No timezone code is needed, and adding some would be a bug.** `challenge_start_iso` carries `+05:30`, so the instant it names *is* IST midnight. Differencing two absolute instants therefore lands every day boundary on IST midnight automatically, on a laptop set to any timezone. This is the same reason `lib/countdown.ts` has no timezone logic.

- [ ] **Step 1: Write the failing tests**

Create `lib/challenge.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { baselineLabel, challengeDay } from '@/lib/challenge'

const start = new Date('2026-08-18T00:00:00+05:30')
const end = new Date('2026-08-31T23:59:59+05:30')

describe('challengeDay', () => {
  it('counts a fourteen-day challenge from day one', () => {
    expect(challengeDay(start, end, Date.parse('2026-08-18T09:00:00+05:30'))).toEqual({ day: 1, total: 14 })
    expect(challengeDay(start, end, Date.parse('2026-08-19T12:41:00+05:30'))).toEqual({ day: 2, total: 14 })
    expect(challengeDay(start, end, Date.parse('2026-08-31T23:00:00+05:30'))).toEqual({ day: 14, total: 14 })
  })

  it('rolls the day at IST midnight, from any machine', () => {
    expect(challengeDay(start, end, Date.parse('2026-08-19T23:59:00+05:30'))?.day).toBe(2)
    expect(challengeDay(start, end, Date.parse('2026-08-20T00:01:00+05:30'))?.day).toBe(3)
    // The same two instants, named from London. Same answer.
    expect(challengeDay(start, end, Date.parse('2026-08-19T18:29:00Z'))?.day).toBe(2)
    expect(challengeDay(start, end, Date.parse('2026-08-19T18:31:00Z'))?.day).toBe(3)
  })

  it('is null before it opens, after it closes, and when the sheet is silent', () => {
    expect(challengeDay(start, end, Date.parse('2026-08-17T23:00:00+05:30'))).toBeNull()
    expect(challengeDay(start, end, Date.parse('2026-09-01T00:30:00+05:30'))).toBeNull()
    expect(challengeDay(null, end, Date.now())).toBeNull()
    expect(challengeDay(start, null, Date.now())).toBeNull()
  })
})

describe('baselineLabel', () => {
  it('names the day the baseline was photographed, not the day trading opened', () => {
    expect(baselineLabel(start)).toBe('17 Aug')
    expect(baselineLabel(new Date('2026-09-01T00:00:00+05:30'))).toBe('31 Aug')
  })

  it('is null when the sheet has not said', () => {
    expect(baselineLabel(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/challenge.test.ts`
Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write the module**

Create `lib/challenge.ts`:

```ts
import { IST_TIMEZONE } from '@/config'

/**
 * Which day of the current two-week challenge it is, and what the baseline day
 * was called. Two pure functions.
 *
 * ── Why there is no timezone arithmetic here ──
 *
 * `challenge_start_iso` carries `+05:30`, so the instant it names *is* IST
 * midnight. Differencing two absolute instants therefore rolls the day at IST
 * midnight on a laptop set to any timezone at all — the same reason
 * `lib/countdown.ts` needs none either. `fleaInstant`'s refusal to parse an
 * offset-less string is what makes that true, and it is load-bearing here.
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** Formats a date as `17 Aug`, in IST, whatever the machine is set to. */
const DAY_MONTH = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: IST_TIMEZONE,
})

/**
 * `{ day, total }`, or `null` when the wall should say nothing.
 *
 * `null` covers four cases that all render the same way and all mean "no claim
 * to make": the sheet has not published the window, the challenge has not
 * opened, and the challenge has closed. A wall that is between challenges says
 * nothing rather than counting a day that does not exist — the same convention
 * the Flea countdown follows once the event is over.
 */
export function challengeDay(
  start: Date | null,
  end: Date | null,
  now: number,
): { day: number; total: number } | null {
  if (start === null || end === null) return null
  const from = start.getTime()
  const to = end.getTime()
  if (now < from || now > to) return null

  // `ceil`, because the window's last instant is 23:59:59 rather than the next
  // midnight: 13 days and 23:59:59 is a fourteen-day challenge, and `round`
  // would agree only by luck at this length.
  const total = Math.ceil((to - from) / DAY_MS)
  const day = Math.floor((now - from) / DAY_MS) + 1
  return { day: Math.min(day, total), total }
}

/**
 * The day the baseline was photographed — `17 Aug` for a challenge opening on
 * the 18th.
 *
 * **One day before the start, deliberately.** The figure on the cards is
 * `total_revenue` minus a snapshot taken at the *close* of the previous day, so
 * "since 17 Aug" is what it measures. Derived rather than typed, so 1 September
 * says "since 31 Aug" without a deploy.
 */
export function baselineLabel(start: Date | null): string | null {
  if (start === null) return null
  return DAY_MONTH.format(new Date(start.getTime() - 1))
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/challenge.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the band component**

Create `components/ChallengeDay.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

import { TICK_SLOW_MS } from '@/config'
import { challengeDay } from '@/lib/challenge'

/**
 * `Day 2 of 14`, in the slot `/weekly`'s band used to give the Mesa Flea.
 *
 * **The Flea has not left the wall** — `/podium` carries its own full countdown,
 * and the rotation still shows it. What changed is which of the two this board
 * leads with: `WallHeader` justified the Flea's prominence as "the only element
 * on this wall that changes what a team does today", and on a fortnightly race
 * with a hard close that reasoning now belongs to the day count.
 *
 * ── Computed, not published ──
 *
 * `TV_Cohort` could carry a `challenge_day` cell and this could print it. It
 * does not, because a published day number freezes when the consolidator stalls
 * — the wall would read `Day 14 of 14` for as long as the sheet stayed down,
 * confidently. Two instants and a clock cannot go stale.
 *
 * Minute ticks, not seconds: the figure changes once a day.
 */
export function ChallengeDay({ start, end }: { start: Date | null; end: Date | null }) {
  const [state, setState] = useState<{ day: number; total: number } | null>(null)

  useEffect(() => {
    const update = () => setState(challengeDay(start, end, Date.now()))
    update()
    const timer = setInterval(update, TICK_SLOW_MS)
    return () => clearInterval(timer)
  }, [start, end])

  // Nothing until mounted — this figure cannot match between the server render
  // and the first client render — and nothing between challenges.
  if (state === null) return null

  return (
    <p className="tv-challenge-day">
      <span className="tv-challenge-day-label">Day</span>{' '}
      <span className="tv-challenge-day-figure">{state.day}</span>{' '}
      <span className="tv-challenge-day-label">of {state.total}</span>
    </p>
  )
}
```

- [ ] **Step 6: Style it inside the band's existing layer**

In `app/mesa-tv.css`, inside the existing `@layer components` block:

```css
/* The day count, in the band slot the Flea dial used to hold. It inherits that
   slot's sizing tokens rather than declaring its own, so the band's type scale
   is unchanged and `WallHeader`'s local redefinitions still govern. */
.tv-challenge-day {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  white-space: nowrap;
}
.tv-challenge-day-label {
  font: var(--t-tv-strip-label);
  letter-spacing: var(--track-overline);
  text-transform: uppercase;
  color: var(--fg1);
}
.tv-challenge-day-figure {
  font: var(--t-tv-cal-figure);
  color: var(--fg-accent);
}
```

**No new hex and no new hue.** Every value above is an existing token. Confirm each one resolves — `--t-tv-cal-figure`, `--t-tv-strip-label`, `--track-overline`, `--fg1`, `--s-2` and the accent the Flea dial used on this band — by reading the computed style back from the running page, not by reading the stylesheet. **A custom property that does not exist emits no rule and no warning**, exactly like a non-existent Tailwind step; substitute the real token name if any of these is wrong on inspection.

Class rules go **inside** `@layer components`, per `AGENTS.md`: unlayered CSS beats every Tailwind utility, and the design system's own classes each set a colour.

Check every class name against the Tailwind utility list in `AGENTS.md` before using it — `.tv-` prefixed names are safe, which is why they are used here.

- [ ] **Step 7: Swap it into the band**

In `components/WallHeader.tsx`, replace the `FleaStrip` import with `ChallengeDay` and `fleaInstant` with `cohortInstant`, then:

```tsx
        <ChallengeDay
          start={snapshot === null ? null : cohortInstant(snapshot.cohort, 'challenge_start_iso')}
          end={snapshot === null ? null : cohortInstant(snapshot.cohort, 'challenge_end_iso')}
        />
```

Update the component's docblock: the paragraph headed "The countdown is the second-loudest thing on the board" now describes the day count, and should say why — a board of standings tells forty teams where they are, and the day count tells them how long they have left to move.

- [ ] **Step 8: Let the legend name the window**

In `components/BoardLegend.tsx`:

```tsx
export function BoardLegend({ since }: { since: string | null }) {
  return (
    <p className="tv-legend">
      <span className="tv-day-mark tv-legend-mark" aria-hidden="true" />
      Today&rsquo;s revenue
      {since === null ? null : <span className="tv-legend-since">Revenue since {since}</span>}
    </p>
  )
}
```

Extend its docblock: the board's main figure changed meaning from "this week" to "since the baseline" and nothing else on screen says so, which is the same argument that put the green triangle's explanation here.

Add a `.tv-legend-since` rule beside `.tv-legend` in `app/mesa-tv.css`, matching its type and colour. The legend sits in the board's bottom margin, which measured 25.8px at 1920 — **if the second phrase does not fit on one line there, it is the legend that gets shorter, never the grid that moves.**

- [ ] **Step 9: Pass the window in**

In `app/weekly/page.tsx`:

```tsx
import { cohortInstant, currentChallenge } from '@/lib/feed'
import { baselineLabel } from '@/lib/challenge'
```

```tsx
      <WallHeader snapshot={snapshot} label="2-Week Challenge" />
```

```tsx
        <BoardLegend
          since={snapshot === null ? null : baselineLabel(cohortInstant(snapshot.cohort, 'challenge_start_iso'))}
        />
```

- [ ] **Step 10: Run everything**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 11: Measure the running app**

Start `npm run dev` and open `http://localhost:3000/weekly` at **1920 × 1080**. Reading the source is not verification — three bugs in this project's history rendered convincingly and passed typecheck, lint and tests.

Confirm by measurement:

1. Nothing escapes the frame. In the browser console:
   ```js
   [...document.querySelectorAll('main *')]
     .map(el => ({ el, r: el.getBoundingClientRect() }))
     .filter(({ r }) => r.width > 0 && (r.right > innerWidth + 0.5 || r.left < -0.5))
     .map(({ el }) => el.textContent.trim().slice(0, 30))
   ```
   Expected: `[]`.
2. The band reads `2-Week Challenge` and `Day 2 of 14`, and the as-of stamp still sits to its right.
3. The legend reads both phrases and sits in the margin — the four grid rows are the same height they were before this task. Compare `document.querySelector('.tv-card-row').getBoundingClientRect().height` against the value on `main` before the change.
4. Rank 1 is the team with the largest challenge figure — cross-check against the published CSV, which had Popsmith & Co. on ₹16,141 on 19 August.
5. Dosa Crisps prints `-₹3,850` and sits at the bottom of the board — below every team on `₹0`, not tied with them.

- [ ] **Step 12: Commit**

```bash
git add lib/challenge.ts lib/challenge.test.ts components/ChallengeDay.tsx components/WallHeader.tsx components/BoardLegend.tsx app/weekly/page.tsx app/mesa-tv.css
git commit -m "The band counts the challenge day, and the legend names the window"
```

---

## What this plan deliberately does not do

- **No storage version bump, and no rename of `BoardState.week`.** Task 3 explains why: the stale-week-meets-new-challenge mismatch seeds every wall exactly once on deploy, which is the behaviour a version bump would have bought.
- **No suppression of the day-one leap.** Spec §7. The wall has done this every Monday for five weeks; a fortnight makes it half as frequent, and the rule would silence a team's first big sale mid-challenge, which is the best news the board can carry.
- **Nothing about `today_revenue`.** Flagged during design as possibly dead, on the evidence that `Daily Dump` column B was empty on 99.4% of sale rows in the 15 August workbook and every team's `today_revenue` read ₹0.

  **That was too strong, and measurement on 19 August corrected it.** Three of 42 teams published a non-zero `today_revenue`, and the green triangle renders on all three — Pitlane ▲₹2,598, Amber ▲₹5,900, The Ugly Mugling ▲₹2,156. Dates *are* being entered on recent sales; the 15 August snapshot was mostly historic rows. The column works, sparsely, and there is nothing to fix here.
- **Nothing on `/podium`.** Its mover panel still reads `weekRevenue` and is still correct — that panel is weekly and is meant to be.
