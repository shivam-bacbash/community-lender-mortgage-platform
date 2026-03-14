# Module 4 Test Plan: AI Pre-qualification

## Scope
Validate the AI workflow from `plan/phase-1/M4-ai-prequalification.md`: automatic analysis on borrower submit, borrower-facing prequalification output, staff-facing underwriting summary, compliance storage, pipeline score badge, and manual re-run behavior.

## Prerequisites
- Run `npm install`
- Set `.env.local` with Supabase values and `OPENAI_API_KEY`
- Start the app with `npm run dev`
- Confirm modules 1, 2, and 3 are already working
- Use seeded users:
  - `borrower.demo@nexuslend.local`
  - `loan.officer.demo@nexuslend.local`
  - `underwriter.demo@nexuslend.local`
  - Password: `Password123!`

## Core Flows
### 1. Auto-run on submit
1. Sign in as `borrower.demo@nexuslend.local`.
2. Create and submit a new loan application from `/borrower/apply`.
3. Open the submitted loan status page.

Expected:
- submit succeeds without waiting on AI completion
- three `ai_analyses` rows are created for `prequalification`, `underwriting_summary`, and `compliance_check`
- each row is append-only and linked to the submitted loan

### 2. Borrower prequalification card
1. Stay on `/borrower/loans/[id]` after submission.
2. Watch the AI card area for up to 30 seconds.

Expected:
- a loading state appears while analysis is pending
- the borrower sees score, recommendation, strengths, concerns, and disclaimer once the result is stored
- no underwriting-only or compliance-only details are exposed to the borrower

### 3. Staff underwriting summary
1. Sign in as `loan.officer.demo@nexuslend.local`.
2. Open `/staff/loans/[id]/underwriting` for the same loan.

Expected:
- the AI underwriting card renders risk score, recommendation, strengths, concerns, suggested conditions, and summary
- the pipeline card for the loan shows an AI score badge with the recommendation tooltip

### 4. Manual re-run
1. From `/staff/loans/[id]/underwriting`, click `Re-run Analysis`.
2. Refresh the page after the action completes.

Expected:
- a new `underwriting_summary` row is inserted instead of updating an old row
- the latest completed result is shown in the UI
- an audit log entry is created for the rerun action

### 5. Failure handling
1. Temporarily unset `OPENAI_API_KEY` or use an invalid key.
2. Submit a new loan application or re-run underwriting.

Expected:
- the page flow does not crash
- a failed `ai_analyses` row is stored with `status = failed`
- borrower pages omit the AI result instead of showing raw errors

### 6. Snapshot safety
1. Inspect the latest `ai_analyses.input_snapshot` row in Supabase.
2. Compare it with the borrower profile and financial records for that loan.

Expected:
- no SSN, full DOB, or raw account numbers appear in the snapshot
- only PII-safe fields and derived underwriting values are included
