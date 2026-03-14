# M13 — Reporting & Analytics · Test Plan

## Scope
Report hub, pipeline velocity, LO production, application funnel, HMDA LAR export, and the download API route.

---

## 0. Access Control (all report pages)

| # | Step | Expected |
|---|------|----------|
| 0.1 | Log in as a `loan_officer` or `processor` and navigate to `/staff/reports` | Redirected to `/staff/dashboard` |
| 0.2 | Log in as `admin` and navigate to `/staff/reports` | Page loads without redirect |
| 0.3 | `admin` accesses `/staff/reports/pipeline`, `/production`, `/funnel`, `/hmda` directly | All pages load; no redirect |
| 0.4 | Unauthenticated request to `/api/reports/hmda-export` | Returns 401 |
| 0.5 | Authenticated non-admin request to `/api/reports/hmda-export` | Returns 403 |

---

## 1. Report Hub (`/staff/reports`)

| # | Step | Expected |
|---|------|----------|
| 1.1 | Load hub as admin | 4 summary metric cards render: Total Loans, Funded YTD, Volume YTD, Avg Days to Close |
| 1.2 | Metric cards show non-negative numbers | No NaN, undefined, or negative values displayed |
| 1.3 | 4 report link cards visible | Pipeline Velocity, LO Production, Application Funnel, HMDA Export |
| 1.4 | Click each report card | Navigates to the correct sub-report page |
| 1.5 | "Reports" appears in staff nav bar | Link to `/staff/reports` visible |

---

## 2. Pipeline Velocity (`/staff/reports/pipeline`)

| # | Step | Expected |
|---|------|----------|
| 2.1 | Load with no search params | Defaults to last 90 days; bar chart renders for all pipeline stages |
| 2.2 | Each bar row shows stage name, bar (width proportional to loan count), count, and avg days | Correct layout |
| 2.3 | Change `startDate` / `endDate` search params and reload | Chart data updates to reflect the selected range |
| 2.4 | Stage with 0 loans | Bar renders at 0 width; count shows 0 |
| 2.5 | Data table below chart | Contains same data as chart; columns: Stage, Loans, Avg Days |
| 2.6 | All bars sum proportionally to the busiest stage being at 100% width | Max-count stage bar fills its container |

---

## 3. LO Production (`/staff/reports/production`)

| # | Step | Expected |
|---|------|----------|
| 3.1 | Load page | Table renders with columns: LO Name, Applications, Funded, Volume, Pull-Through Rate |
| 3.2 | Table sorted by Volume descending | Highest-volume LO is first row |
| 3.3 | Totals row in `<tfoot>` | Shows sum of applications, funded, and total volume across all LOs |
| 3.4 | Pull-Through Rate column | Displays as percentage (funded / applications × 100); 0% if no funded loans |
| 3.5 | Volume formatted as currency | e.g. `$1,250,000` |
| 3.6 | Date range filter changes data | Narrowing date range reduces or changes counts |
| 3.7 | Org isolation | LOs from another organization's loans do not appear |

---

## 4. Application Funnel (`/staff/reports/funnel`)

| # | Step | Expected |
|---|------|----------|
| 4.1 | Load page | Funnel rows render for each pipeline stage in order |
| 4.2 | Bar widths proportional to loan count | First (largest) stage bar is widest |
| 4.3 | Conversion rate displayed | Shows percentage relative to the previous stage and from initial stage |
| 4.4 | Color progression | Bars visually differentiated (blue → green gradient or similar) |
| 4.5 | Data table below | Same data in tabular form |
| 4.6 | Date range filter | Updates funnel to reflect selected period |

---

## 5. HMDA Report Page (`/staff/reports/hmda`)

| # | Step | Expected |
|---|------|----------|
| 5.1 | Load page (default year = current year) | Record count badge shown; table renders |
| 5.2 | Table shows key HMDA fields | Action taken, loan amount, lien status, county, census tract |
| 5.3 | Year selector — change to previous year | Table and count update to show that year's records |
| 5.4 | No records for selected year | Empty state message; download still available (returns header-only file) |
| 5.5 | "Download LAR File" button is present | Visible and enabled |

---

## 6. HMDA Download (`/api/reports/hmda-export`)

| # | Step | Expected |
|---|------|----------|
| 6.1 | Click "Download LAR File" as admin | Browser downloads a `.txt` file named `hmda-lar-{year}.txt` |
| 6.2 | Inspect downloaded file | Pipe-delimited lines; 13 fields per record |
| 6.3 | File with records | Each line corresponds to one HMDA record |
| 6.4 | File with no records | Returns file with header/comment line only; no error |
| 6.5 | `?year=2023` query param | File filtered to 2023 records |
| 6.6 | Content-Type header | `text/plain` |
| 6.7 | Content-Disposition header | `attachment; filename="hmda-lar-{year}.txt"` |

---

## 7. Navigation

| # | Step | Expected |
|---|------|----------|
| 7.1 | Staff nav bar for admin users | "Reports" link present and active on report pages |
| 7.2 | Non-admin staff users | "Reports" link may be visible but clicking redirects away (access controlled at page level) |

---

## Acceptance Criteria (from plan)
- [x] Pipeline velocity report shows avg days per stage
- [x] LO production report shows volume, count, pull-through per LO
- [x] Application funnel shows stage-by-stage conversion rates
- [x] Date range filter works on all reports
- [x] HMDA LAR export generates correct pipe-delimited file
- [x] Reports only show data for the user's organization
