# Module 2 Test Plan: Borrower Portal

## Scope
Validate the borrower-facing portal in `plan/phase-1/M2-borrower-portal.md`: dashboard, 6-step application flow, review/submit, loan status, document upload, messages, and realtime status updates.

## Prerequisites
- Run `npm install`
- Set `.env.local` with Supabase, `APP_SECRET_KEY`, and app URL values
- Start the app with `npm run dev`
- Confirm `supabase/migrations/20260314_001_borrower_portal_support.sql` is applied
- Use the seeded borrower account:
  - Email: `borrower.demo@nexuslend.local`
  - Password: `Password123!`

## Core Flows
### 1. Borrower dashboard
1. Sign in as the seeded borrower.
2. Open `/borrower/dashboard`.
3. Confirm the page shows either existing loans or the empty-state CTA.
4. Click `New application`.

Expected: borrower-only dashboard loads and links into the application flow.

### 2. Multi-step application
1. Open `/borrower/apply/1`.
2. Complete steps 1 through 6 with valid data.
3. Refresh between steps and confirm draft data persists.
4. Confirm step navigation allows going back to completed steps but not jumping forward past incomplete ones.

Expected:
- Step 1 creates a draft `loan_applications` row and property row
- Steps 2-6 save into `borrower_profiles`, `employment_records`, `assets`, and `liabilities`
- Generated `loan_number` follows `LN-YYYY-XXXXX`

### 3. Review and submit
1. Open `/borrower/apply/review`.
2. Confirm each section summary matches prior inputs.
3. Submit the application.

Expected:
- `loan_applications.status` changes from `draft` to `submitted`
- `submitted_at` is set
- User is redirected to `/borrower/loans/[id]`

### 4. Loan status page
1. Open the submitted loan detail page.
2. Confirm current stage, timeline, documents, action items, and message preview render.

Expected: status page shows borrower-owned loan data only.

### 5. Document upload
1. Open `/borrower/loans/[id]/documents`.
2. Upload a PDF or PNG under 25MB.
3. Confirm the document appears in the list with status `pending`.
4. Open the signed view link.

Expected: file uploads to the `documents` bucket and a matching `documents` row is created.

### 6. Messages
1. Open `/borrower/loans/[id]/messages`.
2. Send a borrower message.
3. Reload the page.

Expected: message persists and remains visible in both the thread and loan-detail preview.

### 7. Realtime status refresh
1. Keep `/borrower/loans/[id]` open.
2. In Supabase, update that loan’s `status` or `pipeline_stage_id`.
3. Wait for the realtime subscription to fire.

Expected: the borrower status page updates without a manual refresh.
