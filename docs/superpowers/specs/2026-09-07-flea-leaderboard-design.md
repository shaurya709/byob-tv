# `/flea` — a live Mesa Flea leaderboard

**13 September 2026, 09:00–21:00 IST.** A third board, ranked on Razorpay
transactions rather than on anything a team types.

## 1. Why this board cannot be fed the way the other two are

Every figure on `/podium` and `/weekly` reaches the wall the same way: a team
fills its `Daily Tracker`, the consolidator rolls it into `BYOB_MASTER`, and
`TV_Feed` publishes it. That works because logging a sale is a thing teams do at
the end of a day.

On flea day they are standing at a stall selling. Nobody fills a tracker while
serving a queue, so **both existing boards will be frozen for twelve hours** —
showing a leaderboard that has not moved since breakfast, next to a market that
is visibly busy. That is the failure this board exists to prevent, and it cannot
be fixed by making the trackers easier to fill.

Razorpay already holds every payment within seconds of it happening. This board
reads that.

## 2. What it counts — decided

**Razorpay captured payments only, and the board says so.**

Cash is invisible to it. That is a real gap at a flea market and it is accepted
deliberately: the board is explicitly *digital takings*, not total revenue, so it
is not a competing claim about the same number `/podium` reports. Cash reconciles
into the real record afterwards through the normal tracker route.

Naming it honestly is what makes the two boards able to sit in the same rotation
without one of them lying.

### Known distortion: refunds never come back down

`pullPayments` skips any `payment_id` it has already seen, so a payment captured
at 11:00 and refunded at 15:00 stays `captured` in the sheet forever. Over a
twelve-hour window the effect is small, but it is **one-directional** — the board
can only over-count, never under-count. Not fixed here; recorded so nobody
rediscovers it as a bug.

## 3. The window lives in one cell pair, and everything reads it

`Flea_Config!B1` and `B2` hold the window as real datetimes. Three things read
those two cells and nothing else:

- the `SUMIFS`/`COUNTIFS`/`MAXIFS` on `MesaFlea_TV`
- the flea-day trigger, which uses them to know when to start and when to
  delete itself
- columns F and G, published as `window_start_iso` / `window_end_iso`

So the board reads the window **from the same CSV that carries the figures** and
cannot disagree with its own data about what it is measuring. No date literal
reaches the client — the same rule that makes `baselineLabel` derive "since 31
Aug" from a sheet cell rather than from a constant.

### The calendar correction this forces

`TV_Cohort` publishes `flea_datetime_iso = 2026-09-13T10:00:00+05:30` and
`FLEA_EVENT_DURATION_MS` is 8 hours, so every countdown on the wall is currently
telling campus **10:00–18:00**. The event is **09:00–21:00**.

- `flea_datetime_iso` → `2026-09-13T09:00:00+05:30` — one sheet edit, no deploy
- `FLEA_EVENT_DURATION_MS` → 12 hours — one commit

Both are required. A wall whose countdown and whose leaderboard disagree about
when the flea runs is worse than a wall with no countdown.

## 4. `MesaFlea_TV` — eight columns, formula-only

Forty rows, unsorted, in the Razorpay workbook (not `BYOB_MASTER`).

| Column | Source |
|---|---|
| `team_id`, `venture_name` | typed by hand, A2:B41 |
| `flea_revenue` | `SUMIFS` — dump col D, team = A, status = `captured`, date in window |
| `flea_txns` | `COUNTIFS`, same criteria |
| `last_sale_at` | `MAXIFS` on date, published as an absolute instant |
| `window_start_iso`, `window_end_iso` | derived from `Flea_Config` |
| `as_of` | stamped by the ingestion script, not `NOW()` |

**`as_of` is script-written on purpose.** `NOW()` is volatile, so it would
re-fire 120 full-column aggregations every minute — and worse, it would make the
stamp mean *now* rather than *when we last pulled*. A provenance stamp that
always reads current cannot tell you the pipeline has stalled, which is the one
job it has.

**The tab is not sorted.** Rank is computed client-side, so the comparator is
the single authority on order — the same rule the other two boards follow.

**Only this tab is published, never the document.** The workbook holds
`payment_id`, `email` and `contact` for 9,600 real customer payments.

## 5. Ingestion — additive, and it deletes itself

A new `pullPaymentsRecent()` beside `pullPayments`, using Razorpay's `&from=`
filter so each team is **one page rather than a pagination loop**. The existing
full pull is untouched and remains the backstop.

Chosen cadence: **every 5 minutes**, flea day only.

| | |
|---|---|
| UrlFetch | 12h × 12 runs × 40 teams = **5,760** against a 20,000/day quota |
| Runtime | ~20s a run × 144 runs ≈ **48 min** |

Runtime is the tighter budget, not fetch count. **`verifyPayments` is suspended
for flea day** — it opens 40 workbooks per run and nothing needs it live.

The trigger reads `Flea_Config!B1/B2` and **deletes itself after the window
closes**, so a forgotten trigger cannot burn quota for weeks. `pullPayments` also
gains the `as_of` stamp, so the pipeline is observable from today rather than
first being trusted on the day.

## 6. Wall — one more board, no new machinery

New route `/flea`. Three decisions, all following existing patterns:

**The third CSV joins the atomic snapshot.** `fetchCsv` fetches all three
together — one gate, one cache, one poll — rather than forking the poll logic
into a second hook. **But the flea CSV is read optionally**: a missing tab, a
parse failure or a short export yields `null` and the other two boards are
unaffected. Mandatory rather than defensive — the tab did not exist when this was
written, and the wall had to keep working.

**The flea fetch is cache-busted** with `&_=${Date.now()}`. `cache: 'no-store'`
stops the *browser* reusing a body; it says nothing about an edge cache keyed on
URL. Measurement could not separate the two, so the board does not depend on the
answer. Verified harmless: Google ignores the unknown parameter.

**Ranking is a total order** — `flea_revenue` desc → `flea_txns` desc → `team_id`
asc. At 09:00 all forty teams sit on ₹0, and an order that can shuffle between
two identical fetches is indistinguishable from forty overtakes. This repo has
been bitten by it twice.

**Polling stays at 60s.** The data moves every 5 minutes; polling faster samples
the same bytes.

### Its own row gate

A 25-minute measurement of the live published CSV on an ordinary Monday caught
**three empty exports and two multi-minute hangs**. That is the failure mode
`passesRowGate` exists for, happening several times an hour. The flea board gets
its own gate at 40 rows and its own keep-last-good path: an ungated empty export
would blank the board in front of the whole market.

### End-to-end latency

Payment → ≤5 min to sheet → seconds to CSV → ≤60s poll. **Worst case ~6 minutes,
typical ~3.**

## 7. Empty and degenerate states

- **Before 09:00** every team is on ₹0. The board renders its structure at zero.
  Empty is a valid state; there is no spinner, and there never is on this wall.
- **A team with broken credentials shows ₹0 for twelve hours** on a public TV.
  `API_Errors` shows `SLE-C422` throwing repeated `Razorpay API 401`. All forty
  key pairs must be verified before the 13th. This is the highest-consequence
  open item in the build and it is not a code fix.
- **A team that takes only cash** is indistinguishable from a team that sold
  nothing. Accepted, per §2.

## 8. Verification

The rule that governs this repo: measure the running thing, do not read the
source.

- **The sheet was verified against a past window before being trusted.** Setting
  `Flea_Config!B1/B2` to 29 Aug 09:00–21:00 — the same twelve-hour shape as flea
  day — must yield **₹2,21,070**, **508** transactions, **28** teams with any
  sale, and `SLE-C401` at **₹25,150** / **66** txns / last sale
  `2026-08-29T20:57:01+05:30`. Computed independently from the transaction dump.
  Revenue of 0 everywhere means `B1`/`B2` are text rather than datetimes; an
  error of hours means the spreadsheet timezone is not Asia/Kolkata.
- Unit tests on the flea parser: the row gate, an absent tab, a short export, and
  the total order at forty-way ₹0.
- Layout measured in a browser at 1920×1080, never read off the source.
- When fixing a bug with a test, reintroduce the bug first and confirm the test
  fails.

## 9. Still open

1. **All forty Razorpay credential pairs verified live.** See §7. Blocking.
2. **Whether `/flea` takes over the wall for 09:00–21:00** or joins the rotation
   as a third slide. Proposed: takeover, because the other two boards are frozen
   for exactly that window.
3. **A "just sold" pulse.** `last_sale_at` makes it possible, but at 5-minute
   granularity it fires as a *wave* — every team that sold since the last refresh
   lights at once, every five minutes. Shipping without it; add it only if the
   board reads as dead.
4. **The published CSV URL**, once the tab is published, for `config.ts`.
