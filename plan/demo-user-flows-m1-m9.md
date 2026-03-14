# Demo User Flows for Milestones 1-9

This file maps the seeded demo data in `scripts/sql/seed_demo_m1_m9.sql` to the main role-based walkthroughs for milestones M1 through M9.

## Demo Accounts

Use `Password123!` for every account.

| Role | Email | Primary use |
|---|---|---|
| Borrower | `borrower.demo@nexuslend.local` | Borrower portal, draft/resume, loan status, documents, messages |
| Loan Officer | `loan.officer.demo@nexuslend.local` | Dashboard, pipeline, borrower comms, pricing, rate lock |
| Processor | `processor.demo@nexuslend.local` | Documents, conditions, disclosures, task workflow |
| Underwriter | `underwriter.demo@nexuslend.local` | Underwriting review, credit pull context, AI/risk review |
| Admin | `admin.demo@nexuslend.local` | Underwriting rules, product/rate setup, templates, compliance audit |

## Seeded Loans

| Loan # | Status | Stage | Best demo use |
|---|---|---|---|
| `LN-2026-10001` | `draft` | `Application` | Resume borrower application from step 2 |
| `LN-2026-10002` | `submitted` | `Application` | Fresh submission, AI cards, submitted-today metric |
| `LN-2026-10003` | `processing` | `Processing` | Processor pipeline/demo movement |
| `LN-2026-10004` | `underwriting` | `Underwriting` | Main staff collaboration file: docs, tasks, messages, conditions, AI risk |
| `LN-2026-10005` | `approved` | `Approved` | Pricing, disclosures, accepted docs, compliance, rate lock |
| `LN-2026-10006` | `clear_to_close` | `Clear to Close` | Late-stage closing readiness and jumbo product example |
| `LN-2026-10007` | `denied` | `Denied` | HMDA and denial/compliance terminal-state demo |

## Role Flows

### Borrower

1. Sign in and open `/borrower/dashboard`.
2. Open `LN-2026-10001` by selecting `Continue application` or navigate to `/borrower/apply/2` to show draft resume behavior.
3. Open `LN-2026-10002` at `/borrower/loans/[id]` to show the submitted status page and AI prequalification output.
4. Open `/borrower/loans/[id]/documents` for `LN-2026-10004` to show the pending credit authorization request and uploaded bank statement.
5. Open `/borrower/loans/[id]/messages` for `LN-2026-10004` to show the live borrower-visible thread.
6. Open `LN-2026-10005` to show an approved file with open borrower-facing condition and closing progress.

### Loan Officer

1. Sign in and open `/staff/dashboard` to show metrics populated by `submitted`, `underwriting`, and near-closing files.
2. Open `/staff/pipeline` to show cards spread across `Application`, `Processing`, `Underwriting`, `Approved`, and `Clear to Close`.
3. Open `LN-2026-10004` at `/staff/loans/[id]` for the main collaboration demo.
4. Use `/staff/loans/[id]/documents` on `LN-2026-10004` to show the outstanding `credit_auth` request and the under-review borrower uploads.
5. Use `/staff/loans/[id]/messages` on `LN-2026-10004` to show borrower thread plus internal-note behavior.
6. Use `/staff/loans/[id]/pricing` on `LN-2026-10005` to show rate results, fees, and the active rate lock expiring soon.

### Processor

1. Sign in and open `/staff/loans/[id]/documents` for `LN-2026-10005`.
2. Show accepted/rejected document history, especially the paystub version chain and fulfilled bank-statement request.
3. Open `/staff/loans/[id]/conditions` for `LN-2026-10005` to show one satisfied PTD, one open PTC, and one internal `GENERAL` condition.
4. Open `/staff/loans/[id]/tasks` for `LN-2026-10005` to show the in-progress disclosure-prep task.
5. Open `/staff/loans/[id]/compliance` for `LN-2026-10005` to show LE/CD timing and disclosure records.

### Underwriter

1. Sign in and open `/staff/loans/[id]/underwriting` for `LN-2026-10004`.
2. Show the seeded underwriting summary, compliance check, manual risk assessment, and linked fraud flag context.
3. Reference the latest tri-merge credit report already seeded on the file.
4. Open `LN-2026-10007` to show a completed denial decision with denial reasons and downstream HMDA capture.

### Admin

1. Sign in and open `/admin/settings/underwriting` to show the default seeded rules for `conventional`, `fha`, `va`, `usda`, `jumbo`, and `all`.
2. Open `/admin/settings/products` to show all five seeded loan products.
3. Open one product detail and `/rates` to show a populated LTV x FICO matrix.
4. Open `/admin/templates` to show all nine seeded email templates.
5. Open `/admin/compliance` and `/admin/compliance/audit` to show overview counts plus seeded audit history.

## Table Coverage Summary

The seed file populates milestone tables across:

- Core/auth scope: `organizations`, `profiles`, `branches`, `branch_members`, `pipeline_stages`
- Borrower flow: `loan_applications`, `borrower_profiles`, `employment_records`, `assets`, `liabilities`, `properties`
- Property/docs: `flood_certifications`, `appraisals`, `documents`, `document_requests`, `conditions`
- AI/UW: `ai_analyses`, `fraud_flags`, `underwriting_rules`, `credit_reports`, `underwriting_decisions`
- Pricing: `loan_products`, `rate_sheets`, `loan_fees`, `rate_locks`
- Comms: `tasks`, `messages`, `notifications`, `email_templates`
- Compliance/reporting: `audit_logs`, `disclosures`, `hmda_records`, `analytics_events`

## Important Demo Notes

- The SQL seed creates document rows only. If you want actual preview/download behavior, upload matching files into the Supabase `documents` bucket using the seeded `storage_path` values.
- The main cross-role collaboration loan is `LN-2026-10004`.
- The best pricing/compliance demo loan is `LN-2026-10005`.
- The best terminal-state compliance demo loan is `LN-2026-10007`.
