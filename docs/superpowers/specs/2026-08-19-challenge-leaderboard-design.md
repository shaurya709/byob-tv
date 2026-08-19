# `/weekly` — a two-week challenge board

**Date:** 19 August 2026
**Status:** approved, decisions closed, not yet implemented
**Supersedes:** `/weekly` ranking on `week_revenue` (`docs/DESIGN.md` §4 and §8). The
weekly figure stays published in `TV_Feed` and stays on the `Team` type — `/weekly`
simply stops ranking on it, and stops printing it. Nothing about `/podium` changes.

---

## 1. Why a difference column exists at all

`Daily Team Summary` col B is **cumulative and proof-gated**, and it is the only
revenue figure this system trusts. It only ever goes up, and there is no
revenue-between-two-dates figure anywhere in `BYOB_MASTER`. So the only way to score a
fourteen-day window is to **photograph the running total at the moment the window opened
and subtract it.** `challenge_baseline` is that photograph. It is pasted as values, not
computed, because its entire job is to stop moving while everything around it moves.

The reason to rank on that difference rather than on the total: the all-time board is
effectively frozen. Measured from the live feed on 19 August:

| | all-time | since 17 Aug | rank on total | rank on difference |
|---|---|---|---|---|
| Xoco | ₹1,21,885 | ₹0 | 1st | ~27th |
| THE OLFIQ THEORY | ₹27,905 | ₹15,830 | 38th | 2nd |
| Popsmith & Co. | ₹86,101 | ₹16,141 | 6th | 1st |

No fortnight of trading closes a ₹94,000 gap. Ranking on the difference restarts every
team at ₹0 every two weeks, which is what makes the board a race instead of a monument.

## 2. The calendar — verified, not assumed

| | |
|---|---|
| Challenge 1 | Tue 18 Aug 00:00 → **Mon 31 Aug 09:00 IST** — 13 days 9 hours, counted as 14 |
| Challenge 2 | Tue 1 Sep → Mon 14 Sep |
| Mesa Flea | Sun 13 Sep — **inside challenge 2**, one day before it closes |
| Programme weeks | Mondays. wk 5 = 17 Aug, wk 6 = 24 Aug, wk 7 = 31 Aug |

**The two clocks are offset by one day and will never align.** Challenge periods run
Tuesday→Monday; programme weeks run Monday→Sunday. Week 7 spans *both* the end of
challenge 1 and the start of challenge 2. Anything that treats them as the same period
is wrong on a date it will not announce.

## 3. Sheet contract

### `TV_Feed` — one new column

```
challenge_revenue     = total_revenue − challenge_baseline
```

Plain number: no `₹`, no thousands separator, not text-formatted.

**Column `K` is renamed from `Revenue (17 Aug)` to `challenge_baseline`** and keeps its
frozen values. It may stay on the tab — the wall ignores columns it does not name — but
the date comes out of the header for the reason §8 gives: a header carrying a date is
wrong on 1 September, and a column nobody reads today is a column somebody reads later.

**Columns `I`, `J` and `L` should be removed.** `I`/`J` duplicate `team_id` and
`venture_name`, which means the two blocks are aligned *by row position rather than
joined* — sort either block independently and every team silently inherits someone
else's baseline. `L` was verified to equal `total_revenue` byte-for-byte on all 42 rows.

`M` ("Revenue Difference") as it stands is **pasted zeros, not a formula** — all 42 rows
read 0 while the true deltas span −3,850 to +16,141. `K` being stored as text
(`"₹61,676"`) is the likely cause. `challenge_revenue` replaces it.

### `TV_Cohort` — three new keys

```
current_challenge     1                             → 2 on 1 Sep, 3 after that
challenge_start_iso   2026-08-18T00:00:00+05:30
challenge_end_iso     2026-08-31T09:00:00+05:30
```

**The close is 09:00, not end of day** — confirmed 19 Aug. The window is therefore
13 days and 9 hours, which `challengeDay` counts as fourteen because it takes the
`ceil`: a part-day at the end is still a day of the challenge. `floor` would print
"of 13", and `round` agrees with `ceil` at this length only by coincidence.

The wall stops counting at 09:00 rather than sitting on "Day 14 of 14" for the rest
of the 31st. Between the close and challenge 2 opening, the band shows nothing —
the same silence the Flea countdown keeps once its event is over.

The `+05:30` offset is **mandatory**, for the reason `fleaInstant` already enforces it:
an instant with no offset is parsed in the browser's timezone, so a laptop set to
anything but IST computes a different day number and looks completely healthy doing it.

### Read as optional, exactly like `prev_week_rank`

`challenge_revenue` is **not** added to `FEED_HEADERS`, and the three cohort keys are
**not** added to `COHORT_KEYS`. Every name in those lists is required and a missing one
discards the whole fetch. Keeping these optional means the client can ship before the
sheet work lands, and picks the columns up the moment they appear — no second deploy, no
version check, and no window where a half-migrated sheet blanks the wall.

Until `challenge_revenue` exists, a team's challenge revenue reads 0 and the board sorts
on the all-time tie-break. That is a legible state, not a broken one.

### The rollover is one operation with three parts

On 1 September, in a single edit:

1. Re-freeze `challenge_baseline` to each team's `total_revenue` at the close of 31 Aug.
2. Bump `current_challenge` to `2`.
3. Move `challenge_start_iso` and `challenge_end_iso` to the new window.

Doing (1) without (2) means the wall does not know a reset happened. Doing (2) without
(1) means nothing resets. They are one action.

## 4. Ranking — decided

```
compareChallenge:  challenge revenue desc → all-time revenue desc → team ID asc
```

Same shape as the existing `compareWeek`, and a **total order** for the reason
`lib/ranking.ts` documents: an order that can shuffle between two identical fetches is
indistinguishable from forty teams overtaking each other.

The all-time second key is carried over deliberately. Day one of a challenge has every
team on ₹0, and `compareWeek`'s justification transfers word for word — falling back to
the standing the wall showed all of last fortnight is the reading a passer-by already
has in their head, where ordering forty zeroes by team ID would look arbitrary and would
make `/weekly` disagree with `/podium` for no reason anyone could see.

## 5. The reset guard — the change nothing on screen shows

`lib/overtake.ts` decides whether the wall animates:

```ts
if (prev === null || prev.week !== week) return { state, events: [] }
```

That guard exists because every `week_revenue` drops to ₹0 on Monday at once, and forty
resets must not read as forty overtakes. Pointed at a challenge delta it is wrong in
**both** directions:

- **Mon 24 Aug** — `current_open_week` flips 5→6 but the challenge delta does not reset.
  The guard fires anyway and the wall goes deaf to real overtakes for that tick.
- **Tue 1 Sep** — the challenge *does* reset, but week 7 spans 31 Aug–6 Sep so
  `current_open_week` is unchanged. The guard stays silent exactly when it is needed.

**`BoardSpec` gains an optional `period` accessor**, defaulting to `openWeek`. `/weekly`
overrides it with `currentChallenge`; `/podium` leaves it alone and its behaviour stays
byte-identical.

**Revised 19 Aug, for minimal engineering: nothing is renamed.** The first draft of this
section renamed `DetectInput.week` and `BoardState.week` to `period`, which is the better
name — it was never about weeks, it was about "the figure this board ranks on just reset
to zero for everyone at once". But renaming `BoardState.week` changes the shape of what
every TV holds in `localStorage`, which forces a storage key version bump to keep
`isBoardState` from accepting a record whose new field is `undefined`.

Keeping the name buys the same outcome for nothing. Each wall's stored `week: 5` meets
the new `period: 1` on its first poll after the deploy, `prev.week !== week` fires once,
and the wall records what it sees and animates nothing — which is precisely the seeding
behaviour the version bump existed to produce. The name is carried by a comment instead.

**Not in scope:** `/podium` ranks on `total_revenue`, which never resets, so its guard
only silences Mondays for no benefit. Pre-existing, harmless, and not this change's to
fix.

## 6. Negative deltas — decided: print them, at the bottom of the board

A baseline is a photograph of a proof-gated number, and proof can be revoked *after* the
shutter closes. A sale logged before 17 Aug that later has its proof set to `No` shrinks
the all-time total while the photograph still shows the larger figure. Three teams are
in this state today:

| | photograph | today | difference |
|---|---|---|---|
| Dosa Crisps | ₹61,676 | ₹57,826 | **−₹3,850** |
| Blunnt | ₹29,186 | ₹27,687 | **−₹1,499** |
| Snapper | ₹27,757 | ₹27,756.50 | **−₹0.50** |

This is structural and will recur every challenge. It is not a subtraction bug and there
is nothing to chase.

**Decided, revised 19 Aug:** the card prints the true figure, minus sign and all —
`-₹3,850` — and the team sits at the bottom of the board where the comparator already
puts it. **Nothing is clamped anywhere.** An earlier draft of this section clamped the
display at `₹0`; that was reversed. A team that has gone backwards should see that it
has gone backwards, and the board's own ordering already says the same thing.

This costs nothing in the ranking, which was never going to be clamped: `compareChallenge`
sorts on the real value, so a team on −₹3,850 sits below a team on ₹0 rather than tied
with it.

### The one genuine artefact: `-₹0`

`formatRupees(-0.5)` returns **`-₹0`**. Verified, and the mechanism is worth writing
down because it is not the obvious one: `Math.round(-0.5)` is **negative zero**, and
`Intl.NumberFormat` faithfully renders the sign of a negative zero. Any shortfall
between −₹0.50 and ₹0 hits it, and Snapper was at exactly −₹0.50 on 19 August.

A minus sign in front of a zero reads as a rendering fault rather than a fact, and it is
not a *display* rule but a rounding bug: at whole-rupee precision that value **is** zero,
so the sign is describing precision that was already discarded.

**Fixed in `formatRupees` itself**, which is where every other rupee-rendering rule in
this project lives:

```ts
return RUPEES.format(Math.round(value) || 0)   // `-0 || 0` is `0`
```

`|| 0` rather than a comparison, because `-0 === 0` is `true` and would not catch it.
Every real negative passes through untouched — verified across −0.5, −0.4, −1.5 and
−3,850. `/podium` is unaffected: every figure it prints is a non-negative all-time total,
so no value it formats can reach this branch.

## 7. The day-one leap — decided: no change

**A proposal made in this session and withdrawn in it.** Recorded because the reasoning
is the useful part.

When a challenge opens, every team is on ₹0 and the board falls back to all-time order.
The first team to log any sale becomes the only team with a figure and goes straight to
1st — a climb of perhaps thirty-seven places, animated in full, repeating as each team
opens its account. The proposal was to suppress a flip whose attacker's previous
challenge revenue was ₹0.

It was withdrawn on two counts:

1. **It is not a new behaviour.** `week_revenue` already resets every Monday, so the
   wall has done exactly this weekly for five weeks. A fortnightly period makes it
   happen *half as often*, not more.
2. **It would silence the best thing the board can show.** A team that trades nothing
   for ten days and then lands a ₹20,000 order and takes 1st is the headline of a
   two-week race — and the rule cannot tell it apart from a ₹500 sale on day one,
   because both are a climb from ₹0.

## 8. The band, the header and the legend

- **`FleaStrip` leaves `/weekly`, replaced in the same slot** by the challenge day
  indicator, at the same prominence. `WallHeader` justifies that slot with "the only
  element on this wall that changes what a team does today"; on a fortnightly race that
  reasoning transfers intact.
- **The Flea stays on the wall.** `/podium` carries its own full countdown
  (`PodiumMasthead.tsx:110` and `:188`), so the rotation still shows it. Verified before
  agreeing to the removal.
- **Header label** `"BYOB This Week"` → `"2-Week Challenge"`, via the existing
  `WallHeader` `label` prop.
- **`BoardLegend` gains the window** — the big figure changes meaning from "this week"
  to "since 17 Aug" and nothing on screen would otherwise say so. That component exists
  precisely for marks that carry meaning by convention.

### Derived, never typed — the rule that makes 1 September survivable

`Day 2 of 14` and `since 17 Aug` are both **computed from `challenge_start_iso` and
`challenge_end_iso`**. Neither is a literal in the source.

This is the whole reason the "read the human columns as they are" approach was rejected:
a header reading `Revenue (17 Aug)` becomes `Revenue (31 Aug)` on 1 September, the
schema check throws, and the wall silently freezes on its last good fetch. A date baked
into a string is the same trap wherever it is baked. Derived from the instants, both
strings correct themselves when the cells are edited.

## 9. The day number is computed, not published

**Decided: the client derives it from the two instants.** `TV_Cohort` could publish a
`challenge_day` cell directly, and that would be less client code — but if the
consolidator stalls overnight, a published day number freezes at `Day 14 of 14` forever
while a computed one keeps counting. This wall runs unattended for weeks, and the Flea
countdown is built this way for exactly this reason.

The day boundary is **IST midnight**, not the browser's — and getting there needs no
timezone code at all. `challenge_start_iso` carries `+05:30`, so the instant it names
*is* IST midnight; differencing two absolute instants therefore rolls the day at IST
midnight on a laptop set to anything. This is the same reason `lib/countdown.ts` has no
timezone logic, and it is only true because `cohortInstant` refuses to parse a string
with no offset.

It lives in a new `lib/challenge.ts` rather than in `lib/schedule.ts` — pure, two
functions, no clock of its own. `IST_TIMEZONE` is used once, to format the baseline date
for the legend, which is a display concern rather than an arithmetic one.

## 10. Verification

Per `README.md`, unit tests cover the pure logic and **layout is verified by measuring
the running app at 1920 × 1080**, never by reading source.

Tests, each written by reintroducing the bug first and confirming the test fails:

- `compareChallenge` is a total order, including forty teams on ₹0.
- The period guard stays silent when `current_challenge` changes, and **does not** fire
  on a `current_open_week` change — the 24 August case, which is the one that would
  otherwise pass review by looking correct.
- Display clamps at ₹0 while the comparator keeps the negative — a team on −₹3,850 sorts
  below a team on ₹0 and prints `₹0`.
- `formatRupees` never emits `-₹0` on the card.
- `Day N of M` and the legend string both track a changed `challenge_start_iso`.
- The wall renders with `challenge_revenue` absent from the feed, and picks it up when
  it appears.

Measured on the running app: the band still fits with the challenge indicator in the
Flea's slot, and no element escapes the frame — the `getBoundingClientRect` sweep in
`README.md` returns empty.

## 11. Still open

- **Challenge 2's end date.** Assumed Mon 14 Sep on a fourteen-day cadence, which puts
  the Mesa Flea inside it, one day before it closes. Unconfirmed, and it lives in a
  sheet cell rather than in code, so confirming it later costs one edit.
- **What the board does after Mon 14 Sep**, when the cohort's challenges end. No
  decision needed before 1 September.
