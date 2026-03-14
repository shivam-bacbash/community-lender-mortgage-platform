# Module 3 Test Plan: Loan Officer Dashboard

## Scope
Validate the staff-facing workflow in `plan/phase-1/M3-loan-officer-dashboard.md`: staff dashboard, live pipeline board, loan detail tabs, document review, underwriting decisions, conditions, tasks, messages, and audit-backed mutations.

## Prerequisites
- Run `npm install`
- Set `.env.local` with Supabase, `APP_SECRET_KEY`, and app URL values
- Start the app with `npm run dev`
- Confirm modules 1 and 2 are already working
- Use seeded staff users:
  - `loan.officer.demo@nexuslend.local`
  - `processor.demo@nexuslend.local`
  - `underwriter.demo@nexuslend.local`
  - Password: `Password123!`
- Ensure at least one borrower-submitted loan exists from module 2

## Core Flows
### 1. Staff dashboard
1. Sign in as `loan.officer.demo@nexuslend.local`.
2. Open `/staff/dashboard`.
3. Confirm the metric cards render counts for active loans, submitted today, awaiting underwriting, and closing this week.
4. Confirm recent activity and assigned tasks render.

Expected: dashboard loads only for staff users and shows organization-scoped data.

### 2. Pipeline board
1. Open `/staff/pipeline`.
2. Confirm active loans appear under the correct stage columns.
3. Use search and filters for borrower, loan type, purpose, and SLA state.
4. Drag a loan into another active stage.

Expected:
- Kanban columns are ordered by `pipeline_stages.order_index`
- Drag/drop updates the card immediately
- Refresh confirms the new `pipeline_stage_id` persisted

### 3. Realtime pipeline sync
1. Keep `/staff/pipeline` open in one browser.
2. In a second session or Supabase, move the same loan to another stage.

Expected: the pipeline board updates without a manual refresh.

### 4. Loan overview
1. Open `/staff/loans/[id]` from a pipeline card.
2. Confirm loan summary, property summary, AI analysis, counts, and stage history render.

Expected: overview shows complete org-owned loan data only.

### 5. Borrower tab
1. Open `/staff/loans/[id]/borrower`.
2. Confirm personal info, employment, assets, liabilities, and declarations render.

Expected: borrower financial data is visible read-only for staff.

### 6. Documents tab
1. Open `/staff/loans/[id]/documents`.
2. Request a new document with a due date.
3. Accept one uploaded document.
4. Reject another with a rejection reason.

Expected:
- `document_requests` row is created
- `documents.status` changes correctly
- borrower notification and audit log entries are created

### 7. Underwriting tab
1. Sign in as `underwriter.demo@nexuslend.local`.
2. Open `/staff/loans/[id]/underwriting`.
3. Submit an underwriting decision.

Expected:
- `underwriting_decisions` row is inserted
- `loan_applications.status` updates accordingly
- audit log entry is written

### 8. Conditions, tasks, and messages
1. Add a condition on `/staff/loans/[id]/conditions`.
2. Mark one condition satisfied or waived.
3. Add and complete a task on `/staff/loans/[id]/tasks`.
4. Send a borrower-facing and an internal message on `/staff/loans/[id]/messages`.

Expected:
- condition/task/message mutations persist
- internal messages stay staff-only
- borrower-facing updates create notifications where applicable
