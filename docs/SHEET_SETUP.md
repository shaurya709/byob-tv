# Sheet setup — the two new tabs in `BYOB_MASTER`

**v2 — supersedes the three-tab setup.** If you already built the v1 tabs, do not
read this top to bottom and re-key everything. Go to **[What changed from
v1](#what-changed-from-v1)** first; it is a short list and the published URLs do
not change.

**These formulas have not been run.** They were written against the Apps Script
source (`Consolidate.js`, `Iteration_1.js`), which guarantees *column positions* but
not header text, and I have no access to the live sheet. Paste them, then work
through the verification checklist at the bottom before pointing the wall at them.

## Ground rules

- **Formula-only. No Apps Script.** The master already runs enough of it, and
  formulas re-run themselves whenever the consolidator writes.
- **Do not touch any existing tab.** These two tabs are additive. Nothing in
  `BYOB_Protect_Alerts.js` protects the master, and no script enumerates its tabs,
  so adding them is safe.
- **Reference source tabs by column position, not header name.** `Daily Dump` row 1
  and `Daily Team Summary` A1:L1 are typed by hand — no script writes them, so a
  `MATCH()` on that text is a silent failure waiting to happen.
- Revenue is always `Daily Dump` column **N** (`Money in (₹)`) filtered to
  `Type = "Sale"`. Column N is already proof-gated upstream — a Sale only becomes
  money-in when proof is `Yes` **and** units ≥ 1. Summing column I instead would
  count unproven and zero-unit sales and disagree with every existing rollup.
- **All three revenue figures use that one rule.** `total_revenue` reads it through
  `Daily Team Summary`; `week_revenue` and `today_revenue` apply it directly with a
  date filter. There is one definition of revenue in this build, not three.

Source layout this relies on:

| Tab | Header row | Data rows | Columns used |
|---|---|---|---|
| `Team Links` | 4 | **6–47** | A team ID, E venture name |
| `Daily Dump` | 1 | 2+ | A team, B date, D type, N money in |
| `Daily Team Summary` | 1 | 2–43 | A team, B revenue (proof), D units sold |
| `Sync Status` | 1 | 2–43 | B last sync |

`Weekly — by Team` and `Daily Dump` column H are no longer read. See
[Why `week_revenue` does not come from `Weekly — by Team`](#why-week_revenue-does-not-come-from-weekly--by-team).

---

## What changed from v1

Three things happen in the live master, in this order. Total time: about ten minutes.

### 1. Delete `TV_Helper` entirely

Right-click the tab ▸ Delete. It computed streaks and closed-week rank maths. Nothing
in v2 reads either. If you named it `Streaks_Helper`, that is the same tab.

Nothing else references it once step 2 is done, so delete it **after** step 2 to
avoid `#REF!` noise in between.

### 2. `TV_Feed` — replace the header row and all five formulas

Clear `A1:F43` and paste the new block from [Tab 1](#tab-1--tv_feed-published-as-csv).
Do not patch it column by column; the columns moved.

| Column | v1 | v2 |
|---|---|---|
| A | `team_id` | `team_id` — unchanged |
| B | `venture_name` | `venture_name` — unchanged |
| C | `total_revenue` | `total_revenue` — unchanged |
| D | `total_units` | **`week_revenue`** — new |
| E | `streak_days` | **`today_revenue`** — new |
| F | — | **`total_units`** — moved here from D |

Two new figures, one deletion (`streak_days`), one column that moved. The wall's
weekly slide is sorted on `week_revenue` and its 6pm celebration is ranked on
`today_revenue`, so neither is optional.

### 3. `TV_Cohort` — drop twelve keys, add two

Keep `as_of` exactly as it is. Delete the other twelve rows. Add two.

| Key | v1 | v2 |
|---|---|---|
| `as_of` | ✔ | **keep, unchanged** |
| `current_open_week` | — | **add** |
| `flea_datetime_iso` | — | **add** |
| `biggest_sale_today_team` / `_amount` | ✔ | delete |
| `most_units_today_team` / `_count` | ✔ | delete |
| `biggest_revenue_day_team` / `_amount` / `_date` | ✔ | delete |
| `closed_week_number` | ✔ | delete |
| `closed_week_revenue_team` / `_amount` | ✔ | delete |
| `closed_week_climb_team` / `_ranks` | ✔ | delete |
| `closed_week_improved_team` / `_delta` | ✔ | delete |

The twelve deleted keys fed the fifteen trigger types, which no longer exist. The
wall's only interrupt is now the 6pm celebration, and that is computed client-side
from `today_revenue`.

### What does *not* change

- **The published URLs.** Editing a tab's contents does not change its `gid`. Leave
  both publishes alone; `config.ts` stays as it is. Only *unpublishing* and
  republishing would issue new URLs.
- **`Team Links`.** No logo column was ever added and none is needed — logos live in
  `config.ts`.
- **Row count.** `TV_Feed` still publishes **42** rows, `SLE-C401`–`SLE-C442`. The
  client filters the two spares out; the sanity gate still counts 42.
- **The timezone precondition**, which is still unconfirmed. See
  [Publishing](#publishing).

---

## Tab 1 — `TV_Feed` (published as CSV)

Row 1, verbatim — the client parses these by name, so spelling matters and order
does not:

```
team_id    venture_name    total_revenue    week_revenue    today_revenue    total_units
```

Row 2 only. Each formula spills down 42 rows, so there is nothing to fill down.

```
A2  =ARRAYFORMULA(IF('Team Links'!A6:A47="","",'Team Links'!A6:A47))

B2  =ARRAYFORMULA(IF(A2:A43="","",IFERROR(TRIM('Team Links'!E6:E47),"")))

C2  =ARRAYFORMULA(IF(A2:A43="","",IFERROR(VLOOKUP(A2:A43,'Daily Team Summary'!$A$2:$D$43,2,FALSE),0)))

D2  =BYROW(A2:A43,LAMBDA(t,IF(t="","",SUMIFS('Daily Dump'!$N:$N,'Daily Dump'!$A:$A,t,'Daily Dump'!$D:$D,"Sale",'Daily Dump'!$B:$B,">="&(TODAY()-MOD(TODAY()-DATE(2026,7,20),7)),'Daily Dump'!$B:$B,"<="&TODAY()))))

E2  =BYROW(A2:A43,LAMBDA(t,IF(t="","",SUMIFS('Daily Dump'!$N:$N,'Daily Dump'!$A:$A,t,'Daily Dump'!$D:$D,"Sale",'Daily Dump'!$B:$B,TODAY()))))

F2  =ARRAYFORMULA(IF(A2:A43="","",IFERROR(VLOOKUP(A2:A43,'Daily Team Summary'!$A$2:$D$43,4,FALSE),0)))
```

**`BYROW` for D and E, `ARRAYFORMULA` for the rest.** `SUMIFS` does not spill inside
an `ARRAYFORMULA` — it collapses to one value for the whole column, which looks like
a working formula and puts the same number on all 42 rows. `BYROW` evaluates it once
per team, which is what is wanted. Checklist item 4 catches it if this goes wrong.

**Looked up by team ID, not read positionally.** `Daily Team Summary` is generated
in `Team Links` order, so row alignment currently holds — but if it ever slips, a
positional read would attribute one team's revenue to another and the wall would
show it confidently for a week. A `VLOOKUP` cannot do that.

### The week window

`TODAY() - MOD(TODAY() - DATE(2026,7,20), 7)` is the Monday that opened the current
challenge week. The programme starts on a Monday, so this lands on a Monday for the
rest of it. On 11 Aug 2026 it resolves to **10 Aug**, and `week_revenue` is that
team's Monday-to-today total.

The upper bound is `TODAY()`, not `week_start + 6`. A sale mis-dated into the future
would otherwise inflate the current week and put a team on the weekly podium for
days.

> **The 20 July 2026 anchor is written in exactly two cells:** `TV_Feed!D2` here, and
> `current_open_week` on `TV_Cohort`. If the programme start ever moves, change both.
> Checklist item 6 is the cross-check that they still agree.

### Why `week_revenue` does not come from `Weekly — by Team`

The pivot brief specifies `Weekly — by Team` filtered to the open week. This uses
`Daily Dump` instead, for three reasons:

1. **One revenue definition.** All three revenue columns then apply the same
   `column N, Type = "Sale"` rule. A weekly figure sourced elsewhere can disagree
   with the daily and total figures beside it on the same row, and on a wall nobody
   would notice for weeks.
2. **The open week may not have a row.** `Weekly — by Team` is written by the
   consolidator and I cannot verify without sheet access whether it carries the
   *current, incomplete* week or only closed ones. If it only carries closed weeks,
   the brief's formula returns 0 for every team, all week, and slide 2 is blank.
3. **That tab is week-major and hardcodes 42 into its row arithmetic.** Reading it by
   `SUMIFS` on team + week is safe, but it is a second thing that has to stay true.

Checklist item 6 has you compare the two for one team once. If they disagree, that
tells you which of the two is tracking the open week — and I would rather you find
that out from a cross-check than from a blank wall.

---

## Tab 2 — `TV_Cohort` (published as CSV)

Two columns. `A1` = `key`, `B1` = `value`. Then three rows — column A is typed text,
column B is the value.

An empty value is fine and means "not known right now". A **missing key** throws in
the client and discards the tick, so all three rows must exist.

| A (type verbatim) | B |
|---|---|
| `as_of` | `=TEXT(MAX('Sync Status'!$B$2:$B$43),"dd mmm HH:mm")` |
| `current_open_week` | `=MAX(1,INT((TODAY()-DATE(2026,7,20))/7)+1)` |
| `flea_datetime_iso` | `2026-09-06T10:00:00+05:30` — **typed, not a formula** |

**`as_of` reads `Sync Status`, not `NOW()`.** `NOW()` would restamp on every
recalculation and the wall would look freshly updated even while the data underneath
was days stale — which is the exact failure this stamp exists to expose.

**`current_open_week` is not clamped at 8.** The eight challenge weeks end on 13 Sep
but the programme runs to 30 Sep, and a clamp would freeze the weekly board on week
8's numbers for the last fortnight. On 11 Aug 2026 it reads **4**.

**`flea_datetime_iso` needs the cell formatted as plain text first** — Format ▸ Number
▸ Plain text — before you type it. Otherwise Sheets parses it as a date and publishes
something the client cannot read. After typing, the cell should still read
`2026-09-06T10:00:00+05:30` character for character, left-aligned.

Keep the `+05:30` offset. It is what makes the countdown correct on a laptop set to
any timezone: the client subtracts two absolute instants and never asks what timezone
it is in.

**The 10:00 opening time is still assumed, not confirmed.** This is now the one place
it is written down, which is the point of moving it here — correcting it is one cell,
not a commit and a redeploy.

---

## Publishing

**File ▸ Share ▸ Publish to web**, and publish **`TV_Feed` and `TV_Cohort` only**,
each as **Comma-separated values (.csv)**. Leave "Automatically republish when
changes are made" on. Do not publish the entire document.

If you published these in v1, **they are already published and the URLs are
unchanged** — skip this section apart from the timezone check.

Paste both URLs into `config.ts` as the **defaults** of `FEED_CSV_URL` and
`COHORT_CSV_URL`. They are public and carry no secret — the data is going onto
public TVs — which is why they stay in committed config rather than living only in
an env var a fresh deploy would be missing.

Each can still be overridden per-environment by `NEXT_PUBLIC_FEED_CSV_URL` /
`NEXT_PUBLIC_COHORT_CSV_URL`; see the README. That override exists for local
fixtures, so nobody has to edit the lines above and risk committing the edit.

Google caches a published CSV for about five minutes. The wall polls every 60
seconds, so it sees a change within roughly six minutes of the consolidator writing.

Also confirm, once: **File ▸ Settings ▸ Time zone is `(GMT+05:30) India Standard
Time`.** That setting is separate from `appsscript.json`, and `TODAY()` follows the
spreadsheet. If it is wrong, `today_revenue` is a day out near midnight — and in v2
`today_revenue` drives both the 6pm celebration and a whole column of slide 2, so it
is worth thirty seconds to check.

---

## Verification checklist

Work through this before pointing the wall at the URLs. Each line is a number you can
read off two places and compare.

1. `TV_Feed` has exactly **42** data rows, `A2` = `SLE-C401`, `A43` = `SLE-C442`.
2. Pick any team. Its `total_revenue` equals that team's `Revenue (proof) ₹` on
   `Daily Team Summary` — the same figure the admin dashboard leads on.
3. `week_revenue` ≤ `total_revenue` for **every** team, and `today_revenue` ≤
   `week_revenue` for every team. Any row that breaks this has its date filter wrong.
4. `week_revenue` is **not** identical down all 42 rows. If it is, `BYROW` collapsed
   and every team is showing the cohort total.
5. Pick a team you know sold today: `today_revenue` > 0. If every team reads 0 on a
   day with sales, `Daily Dump` column B is carrying a time component and `=TODAY()`
   no longer matches it.
6. `TV_Cohort!current_open_week` reads **4** on 11 Aug 2026 and increments each
   Monday. For one team, compare `TV_Feed` `week_revenue` against
   `=SUMIFS('Weekly — by Team'!$C:$C,'Weekly — by Team'!$A:$A,"SLE-C4xx",'Weekly — by Team'!$B:$B,4)`
   in a scratch cell. They should match, or the weekly tab should read 0 — anything
   else means one of them is on the wrong week boundary. Delete the scratch cell after.
7. `TV_Cohort` has exactly **three** keys in column A, spelled as listed, and
   `TV_Helper` no longer exists in the tab bar.
8. `flea_datetime_iso` is left-aligned and reads `2026-09-06T10:00:00+05:30`. If it
   is right-aligned or shows `06/09/2026`, the cell was not plain text.
9. Open both published URLs in a private window. Each returns CSV, not an HTML
   sign-in page. A revoked publish answers with HTTP 200 and a login page, so the only
   reliable check is looking at what comes back.
10. `as_of` shows a time close to the last consolidator run, and does **not** advance
    when you merely reopen the sheet.

---

## Rebuilds, and why the wall does not flinch at them

**The master is never readable in a torn state.** The consolidator builds its output
in memory and writes it under `LockService`, so nothing reading the spreadsheet ever
sees a half-updated `Daily Dump`. Formulas on these two tabs inherit that: they
recalculate against a consistent sheet, and the numbers they publish are consistent
with each other.

The narrow window that does exist is outside Apps Script. A full rebuild does
`clearContent` and then `setValues`, roughly 200ms apart, and **Google's CSV export
can re-read the sheet inside that gap**. The export that comes back is short, or
carries `#REF!` where a formula's source has momentarily gone.

That is the one input that can put nonsense on the wall with no error anywhere:
teams vanish, the remaining ranks close up around the hole, and the boot kick treats
every one of those shifts as news.

**The client rejects it on row count alone.** A fetch yielding fewer than **40** rows
with a non-empty `team_id` and a numeric `total_revenue` is discarded whole — nothing
parsed, nothing stored, nothing animated, last-good data left on screen and a line in
the console. Forty because `SLE-C441` and `SLE-C442` are spares; a short export cannot
*add* rows, so the check is a floor and never a ceiling.

Built, in `passesRowGate` and `parseTeams` (`lib/feed.ts`). There is no cohort-total
floor and no stored threshold — one number, one decision, nothing that needs tuning.

Nothing is required of the sheet for this. It is here because this document is where
the cause lives.
