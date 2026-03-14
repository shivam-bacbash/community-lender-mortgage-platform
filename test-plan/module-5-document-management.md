# Module 5 Test Plan: Document Management

## Scope
Validate the full document workflow from `plan/phase-2/M5-document-management.md`: version-aware borrower uploads, AI document classification, checklist completion, expiry alerts, staff review actions, and staff-side version history.

## Prerequisites
- Run `npm install`
- Set `.env.local` with Supabase values and `OPENAI_API_KEY`
- Start the app with `npm run dev`
- Confirm modules 1 through 4 are already working
- Use seeded users:
  - `borrower.demo@nexuslend.local`
  - `loan.officer.demo@nexuslend.local`
  - `underwriter.demo@nexuslend.local`
  - Password: `Password123!`
- Ensure at least one submitted borrower loan exists

## Core Flows
### 1. Borrower upload and checklist
1. Sign in as `borrower.demo@nexuslend.local`.
2. Open `/borrower/loans/[id]/documents`.
3. Upload a required document such as `paystub`.

Expected:
- upload succeeds without leaving the page
- the document appears in the list with `v1`
- checklist progress increases for that document type
- staff document page shows the same latest upload

### 2. Versioning on re-upload
1. Re-upload another file using the same `document_type`.
2. Open `/staff/loans/[id]/documents`.
3. Open the document detail page for that type.

Expected:
- the older row is marked `is_latest = false`
- the new row is inserted with `version = previous + 1`
- the new row keeps `parent_document_id` linked to the original version chain
- version history shows all versions in reverse order

### 3. AI classification
1. Upload a new borrower document while `OPENAI_API_KEY` is configured.
2. Inspect the staff document list and detail page.
3. Optionally verify the latest `ai_analyses` row in Supabase.

Expected:
- a `document_extraction` analysis row is inserted
- `documents.ai_extracted_data` is populated
- the staff UI shows detected type, confidence, extracted fields, and anomalies when present

### 4. Request fulfillment and review workflow
1. Sign in as `loan.officer.demo@nexuslend.local`.
2. Request a document from `/staff/loans/[id]/documents` with a due date.
3. Sign back in as the borrower and upload that document type.
4. Accept the document once, then reject a later replacement with a reason.

Expected:
- the pending request moves to `fulfilled` when the borrower uploads the requested type
- accept leaves the request fulfilled
- reject sends the borrower notification text and reopens the linked request to `pending`
- borrower document list shows the rejection reason on the latest rejected version

### 5. Expiry alerts
1. In Supabase, set an accepted latest document `expires_at` to within 7 days.
2. Reload borrower and staff document pages.

Expected:
- expiry warning banner appears on both pages
- expired files render as higher-severity alerts than merely expiring files

### 6. Staff detail route
1. Open `/staff/loans/[id]/documents/[docId]`.
2. Review preview, extraction data, request history, and version history.
3. Open an older version from the version timeline.

Expected:
- preview works for PDF and image files with a signed URL
- the detail page loads for both latest and older versions
- request history is filtered to the same document type
