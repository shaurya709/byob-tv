# Sheet setup — the three new tabs in `BYOB_MASTER`

**These formulas have not been run.** They were written against the Apps Script
source (`Consolidate.js`, `Iteration_1.js`), which guarantees *column positions* but
not header text, and I have no access to the live sheet. Paste them, then work
through the verification checklist at the bottom before pointing the wall at them.
Every formula is independently checkable — that is why the work is split across
helper columns rather than packed into three clever one-liners.

## Ground rules

- **Formula-only. No Apps Script.** The master already runs enough of it, and
  formulas re-run themselves whenever the consolidator writes.
- **Do not touch any existing tab.** These three tabs are additive. Nothing in
  `BYOB_Protect_Alerts.js` protects the master, and no script enumerates its tabs,
  so adding them is safe.
- **Reference source tabs by column position, not header name.** `Daily Dump` row 1,
  `Daily Team Summary` A1:L1 and `Weekly — by Team` row 1 are typed by hand — no
  script writes them, so a `MATCH()` on that text is a silent failure waiting to
  happen. The existing summary formulas reference positionally; these follow suit.
- **`Weekly — by Team` contains a U+2014 em dash**, not a hyphen or en dash. Copy the
  tab name rather than retyping it.
- Revenue is always `Daily Dump` column **N** (`Money in (₹)`) filtered to
  `Type = "Sale"`. Column N is already proof-gated upstream — a Sale only becomes
  money-in when proof is `Yes` **and** units ≥ 1. Summing column I instead would
  count unproven and zero-unit sales and disagree with every existing rollup.

Source layout this relies on:

| Tab | Header row | Data rows | Columns used |
|---|---|---|---|
| `Team Links` | 4 | **6–47** | A team ID, E venture name |
| `Daily Dump` | 1 | 2+ | A team, B date, D type, H units, N money in |
| `Daily Team Summary` | 1 | 2–43 | A team, B revenue (proof), D units sold |
| `Weekly — by Team` | 1 | 2–337 | A team, B week (1–8), C revenue |
| `Sync Status` | 1 | 2–43 | B last sync |

---

## Tab 1 — `TV_Helper` (hidden, not published)

Named `TV_Helper` rather than `Streaks_Helper` as the brief had it, because it ended
up carrying the weekly rank maths too and the name should say what the tab does.

Row 1 is a label row. Put the closed-week number in **M1**:

```
=MAX(0, MIN(8, INT((TODAY() - DATE(2026,7,20)) / 7)))
```

The number of *fully completed* challenge weeks, anchored to the programme's own
20 July 2026 Monday. It is `0` until the first week closes and clamps at 8. Today
(11 Aug 2026) it should read **3** — weeks 1–3 are complete and week 4 is running.

Then, in row 2, filling down to **row 43** (42 teams):

| Cell | Formula | What it is |
|---|---|---|
| `A2` | `=IF('Team Links'!A6="","",'Team Links'!A6)` | team ID |
| `B2` | see below | `streak_days` |
| `C2` | `=SUMIFS('Weekly — by Team'!$C:$C, 'Weekly — by Team'!$A:$A, $A2, 'Weekly — by Team'!$B:$B, $M$1)` | revenue in the closed week |
| `D2` | `=SUMIFS('Weekly — by Team'!$C:$C, 'Weekly — by Team'!$A:$A, $A2, 'Weekly — by Team'!$B:$B, $M$1-1)` | revenue the week before |
| `E2` | `=C2-D2` | week-over-week improvement |
| `F2` | `=SUMIFS('Weekly — by Team'!$C:$C, 'Weekly — by Team'!$A:$A, $A2, 'Weekly — by Team'!$B:$B, "<="&$M$1)` | cumulative through the closed week |
| `G2` | `=SUMIFS('Weekly — by Team'!$C:$C, 'Weekly — by Team'!$A:$A, $A2, 'Weekly — by Team'!$B:$B, "<="&$M$1-1)` | cumulative through the week before |
| `H2` | `=IF($A2="","",RANK($F2,$F$2:$F$43))` | rank at the close of the week |
| `I2` | `=IF($A2="","",RANK($G2,$G$2:$G$43))` | rank a week earlier |
| `J2` | `=I2-H2` | ranks climbed (positive is upward) |
| `K2` | `=IF($A2="","",RANK(VLOOKUP($A2,'Daily Team Summary'!$A$2:$B$43,2,FALSE), ARRAYFORMULA(VLOOKUP($A$2:$A$43,'Daily Team Summary'!$A$2:$B$43,2,FALSE))))` | current rank, for the rank-25 floor |

**Why the climb is computed this way.** The build brief ranked `prev_week_revenue`
against `current_rank`, which compares a *weekly* figure with a *cumulative* one and
produces a meaningless number. Columns F and G are both cumulative, so H and I are
comparable by construction and J is a real change in standing.

### `B2` — the streak

```
=IF($A2="","",
  IFERROR(
    MATCH(FALSE,
      ARRAYFORMULA(
        SUMIFS('Daily Dump'!$N:$N,
               'Daily Dump'!$A:$A, $A2,
               'Daily Dump'!$D:$D, "Sale",
               'Daily Dump'!$B:$B, TODAY() - SEQUENCE(80,1,0,1)) > 0
      ),
    0) - 1,
  80)
)
```

Reads as: for each of the last 80 days, did this team log a Sale with money in?
`MATCH(FALSE, …, 0)` finds the first day they did not; one less than that is the run
of consecutive selling days ending today. If all 80 sold, `MATCH` errors and the
`IFERROR` returns 80. Eighty days covers the whole programme (20 Jul – 30 Sep).

A day with only unproven or zero-unit sales scores 0 in column N and correctly
breaks the streak.

---

## Tab 2 — `TV_Feed` (published as CSV)

Row 1, verbatim — the client parses these by name:

```
team_id    venture_name    total_revenue    total_units    streak_days
```

Row 2 only. Each formula spills down 42 rows, so there is nothing to fill.

```
A2  =ARRAYFORMULA(IF('Team Links'!A6:A47="","",'Team Links'!A6:A47))
B2  =ARRAYFORMULA(IF(A2:A43="","",IFERROR(TRIM('Team Links'!E6:E47),"")))
C2  =ARRAYFORMULA(IF(A2:A43="","",IFERROR(VLOOKUP(A2:A43,'Daily Team Summary'!$A$2:$D$43,2,FALSE),0)))
D2  =ARRAYFORMULA(IF(A2:A43="","",IFERROR(VLOOKUP(A2:A43,'Daily Team Summary'!$A$2:$D$43,4,FALSE),0)))
E2  =ARRAYFORMULA(IF(A2:A43="","",IFERROR(VLOOKUP(A2:A43,TV_Helper!$A$2:$B$43,2,FALSE),0)))
```

**Looked up by team ID, not read positionally.** `Daily Team Summary` is generated
in `Team Links` order, so row alignment currently holds — but if it ever slips, a
positional read would attribute one team's revenue to another and the wall would
show it confidently for a week. A `VLOOKUP` cannot do that.

Five columns is the whole feed. `current_rank` is not published because the client
computes rank itself (revenue desc → units desc → team ID asc), so the sort is the
single authority on order; `logo_filename` lives in `config.ts`; and the weekly and
daily per-team figures the brief listed have no consumer in the fifteen triggers or
either slide.

---

## Tab 3 — `TV_Cohort` (published as CSV)

Two columns. `A1` = `key`, `B1` = `value`. Then one row per key — column A is typed
text, column B is the formula.

An empty value is fine and means "nobody holds this right now". A **missing key**
throws in the client and discards the tick, so all fifteen rows must exist.

| A (type verbatim) | B |
|---|---|
| `as_of` | `=TEXT(MAX('Sync Status'!$B$2:$B$43),"dd mmm HH:mm")` |
| `biggest_sale_today_team` | `=IFERROR(INDEX(SORT(FILTER({'Daily Dump'!$A$2:$A,'Daily Dump'!$N$2:$N},'Daily Dump'!$D$2:$D="Sale",'Daily Dump'!$B$2:$B=TODAY()),2,FALSE),1,1),"")` |
| `biggest_sale_today_amount` | same, ending `,1,2),"")` |
| `most_units_today_team` | `=IFERROR(INDEX(SORT(QUERY(FILTER({'Daily Dump'!$A$2:$A,'Daily Dump'!$H$2:$H},'Daily Dump'!$D$2:$D="Sale",'Daily Dump'!$B$2:$B=TODAY()),"select Col1, sum(Col2) group by Col1 label sum(Col2) ''"),2,FALSE),1,1),"")` |
| `most_units_today_count` | same, ending `,1,2),"")` |
| `biggest_revenue_day_team` | see below |
| `biggest_revenue_day_amount` | see below |
| `biggest_revenue_day_date` | see below |
| `closed_week_number` | `=TV_Helper!$M$1` |
| `closed_week_revenue_team` | `=IF(TV_Helper!$M$1=0,"",IFERROR(INDEX(SORT({TV_Helper!$A$2:$A$43,TV_Helper!$C$2:$C$43},2,FALSE),1,1),""))` |
| `closed_week_revenue_amount` | same, ending `,1,2),""))` |
| `closed_week_climb_team` | `=IF(TV_Helper!$M$1<2,"",IFERROR(INDEX(SORT(FILTER({TV_Helper!$A$2:$A$43,TV_Helper!$J$2:$J$43},TV_Helper!$K$2:$K$43<=25,TV_Helper!$J$2:$J$43>0),2,FALSE),1,1),""))` |
| `closed_week_climb_ranks` | same, ending `,1,2),""))` |
| `closed_week_improved_team` | `=IF(TV_Helper!$M$1<2,"",IFERROR(INDEX(SORT(FILTER({TV_Helper!$A$2:$A$43,TV_Helper!$E$2:$E$43},TV_Helper!$E$2:$E$43>0),2,FALSE),1,1),""))` |
| `closed_week_improved_delta` | same, ending `,1,2),""))` |

**`as_of` reads `Sync Status`, not `NOW()`.** `NOW()` would restamp on every
recalculation and the wall would look freshly updated even while the data underneath
was days stale — which is the exact failure this stamp exists to expose.

**The rank-25 floor is applied here, in the sheet.** The client only knows *current*
rank, which drifts after the week closes, so a client-side floor would give a
different answer on Wednesday than on Monday.

The climb and improved rows are blank until week 2 closes, because both compare a
week against the one before it and there is no week 0.

### The three `biggest_revenue_day` rows

Highest single-day revenue by any team, ever in the programme. The team and the date
have to come out of the same grouped result, so each row rebuilds it and takes a
different piece.

```
biggest_revenue_day_team
=IFERROR(INDEX(SPLIT(INDEX(SORT(QUERY(FILTER({'Daily Dump'!$A$2:$A&"|"&TEXT('Daily Dump'!$B$2:$B,"yyyy-mm-dd"),'Daily Dump'!$N$2:$N},'Daily Dump'!$D$2:$D="Sale"),"select Col1, sum(Col2) group by Col1 label sum(Col2) ''"),2,FALSE),1,1),"|"),1,1),"")

biggest_revenue_day_date
=IFERROR(TEXT(INDEX(SPLIT(INDEX(SORT(QUERY(FILTER({'Daily Dump'!$A$2:$A&"|"&TEXT('Daily Dump'!$B$2:$B,"yyyy-mm-dd"),'Daily Dump'!$N$2:$N},'Daily Dump'!$D$2:$D="Sale"),"select Col1, sum(Col2) group by Col1 label sum(Col2) ''"),2,FALSE),1,1),"|"),1,2),"dd mmm"),"")

biggest_revenue_day_amount
=IFERROR(INDEX(SORT(QUERY(FILTER({'Daily Dump'!$A$2:$A&"|"&TEXT('Daily Dump'!$B$2:$B,"yyyy-mm-dd"),'Daily Dump'!$N$2:$N},'Daily Dump'!$D$2:$D="Sale"),"select Col1, sum(Col2) group by Col1 label sum(Col2) ''"),2,FALSE),1,2),"")
```

If the `|` join proves awkward in practice, the cheaper fix is a small helper block
on `TV_Helper` rather than more nesting here.

---

## Publishing

**File ▸ Share ▸ Publish to web**, and publish **`TV_Feed` and `TV_Cohort` only**,
each as **Comma-separated values (.csv)**. Leave "Automatically republish when
changes are made" on. Do not publish `TV_Helper`, and do not publish the entire
document.

Paste both URLs into `config.ts` as `FEED_CSV_URL` and `COHORT_CSV_URL`. They are
public and carry no secret — the data is going onto public TVs — which is why they
live in committed config rather than an env var a fresh deploy would be missing.

Google caches a published CSV for about five minutes. The wall polls every 60
seconds, so it sees a change within roughly six minutes of the consolidator writing.

Also confirm, once: **File ▸ Settings ▸ Time zone is `(GMT+05:30) India Standard
Time`.** That setting is separate from `appsscript.json`, and `TODAY()` follows the
spreadsheet. If it is wrong, "today's sales" is a day out near midnight.

---

## Verification checklist

Work through this before pointing the wall at the URLs. Each line is a number you
can read off two places and compare.

1. `TV_Helper!M1` reads **3** on 11 Aug 2026, and increments each Monday.
2. `TV_Feed` has exactly **42** data rows, `A2` = `SLE-C401`, `A43` = `SLE-C442`.
3. Pick any team. Its `TV_Feed` `total_revenue` equals that team's `Revenue (proof) ₹`
   on `Daily Team Summary` — the same figure the admin dashboard leads on.
4. Pick a team you know traded yesterday and today: `streak_days` ≥ 2. Pick one that
   has never sold: `streak_days` = 0.
5. `TV_Helper` column J is positive for at least one team once week 2 has closed. A
   whole column of zeros means the cumulative columns F/G are not filling.
6. Every one of the **15** keys in `TV_Cohort` column A is present and spelled exactly
   as listed. A missing key throws in the client and freezes the wall on last-good
   data; a missing *value* is fine.
7. Open both published URLs in a private window. Each returns CSV, not an HTML
   sign-in page. A revoked publish answers with HTTP 200 and a login page, so the
   only reliable check is looking at what comes back.
8. `as_of` shows a time close to the last consolidator run, and does **not** advance
   when you merely reopen the sheet.
