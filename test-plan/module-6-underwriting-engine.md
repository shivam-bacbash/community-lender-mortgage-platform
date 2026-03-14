# Module 6 Test Plan: Underwriting Engine

## Scope
Validate the rule-based underwriting workflow from `plan/phase-2/M6-underwriting-engine.md`: admin rule configuration, mock credit pull, automated rule evaluation, persisted risk assessment, approval gating on hard stops, and underwriting decision prefills.

## Prerequisites
- Run `npm install`
- Set `.env.local` with Supabase values and `OPENAI_API_KEY`
- Start the app with `npm run dev`
- Confirm modules 1 through 5 are already working
- Use seeded users:
  - `underwriter.demo@nexuslend.local`
  - `loan.officer.demo@nexuslend.local`
  - `admin.demo@nexuslend.local`
  - Password: `Password123!`
- Ensure at least one submitted loan exists with borrower profile, property, assets, liabilities, and employment data

## Core Flows
### 1. Admin rule settings
1. Sign in as `admin.demo@nexuslend.local`.
2. Open `/admin/settings/underwriting`.
3. Switch between `conventional`, `fha`, `va`, `usda`, `jumbo`, and `all`.
4. Edit an existing rule’s min or max value and save it.
5. Add a custom rule such as `max_cltv` for one tab.

Expected:
- default rules render for each loan type
- save updates the row and refreshes the page
- custom rule is inserted for the selected loan type
- inactive rules stay in the settings list but are ignored by evaluation

### 2. Mock credit pull
1. Sign in as `underwriter.demo@nexuslend.local`.
2. Open `/staff/loans/[id]/underwriting`.
3. Click `Pull mock credit`.

Expected:
- a `credit_reports` row is inserted
- the score appears in the automated underwriting card
- an audit log entry is written for the mock credit pull

### 3. Automated underwriting run
1. From the same underwriting page, click `Run automated UW`.
2. Refresh the page.
3. Optionally inspect the latest `ai_analyses` row in Supabase for `analysis_type = risk_assessment`.

Expected:
- a completed `risk_assessment` row is inserted in `ai_analyses`
- the card shows recommendation, pass/fail rows, thresholds, DTI, LTV, reserves, and hard-stop/advisory status
- recommendation reflects the active rules for that loan type plus `all` rules

### 4. Hard-stop approval gating
1. In admin settings, tighten a hard-stop rule such as `max_ltv` or `min_credit_score` so the test loan fails it.
2. Re-run automated underwriting on the staff page.
3. Check the decision form.

Expected:
- the page shows `Cannot approve`
- `Approved` and `Approved with conditions` are disabled
- attempting to submit an approval decision via the UI is blocked
- server-side submit also rejects approval if a completed hard-stop failure is on file

### 5. Advisory-only failures
1. Adjust one advisory rule such as `min_months_reserves` so the loan fails only that rule.
2. Re-run automated underwriting.

Expected:
- recommendation becomes `approve_with_conditions`
- the advisory alert appears
- approval choices remain available

### 6. Decision prefills
1. Run automated underwriting with no hard stops.
2. Review the decision form immediately afterward.

Expected:
- the form preselects the automated recommendation
- submitted underwriting decisions store `decision_pass`, current DTI/LTV, latest credit score, and AI summary

### 7. Missing-credit suspension path
1. Use a loan with no credit report.
2. Run automated underwriting before pulling mock credit.

Expected:
- the result persists
- recommendation falls back to a non-approval path because required data is missing
- after pulling credit and re-running, the result updates with a scored evaluation
