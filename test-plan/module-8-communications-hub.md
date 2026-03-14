# Module 8 Test Plan: Communications Hub

## Test Accounts

- Borrower: `borrower.demo@nexuslend.local`
- Loan officer: `loan.officer.demo@nexuslend.local`
- Processor: `processor.demo@nexuslend.local`
- Underwriter: `underwriter.demo@nexuslend.local`
- Admin: `admin.demo@nexuslend.local`
- Password for all: `Password123!`

## Messaging

1. Sign in as borrower and open `/borrower/loans/[loan-id]/messages`.
2. Send a borrower message with and without attached existing documents.
3. In a separate session, sign in as loan officer and open `/staff/loans/[loan-id]/messages`.
4. Verify the borrower message appears without refresh.
5. Send a normal staff reply and verify it appears in the borrower thread in real time.
6. Send a staff message marked `Internal note only` and verify it appears in staff view with the `Internal` badge but never appears in borrower view.

## Notification Bell

1. Keep borrower and staff sessions open.
2. Send a borrower message and verify staff bell unread count increments in real time.
3. Send a staff reply and verify borrower bell unread count increments in real time.
4. Click a notification and verify it marks as read and routes to the linked loan screen.
5. Use `Mark all read` and verify the badge resets to zero.

## Email Templates

1. Sign in as admin and open `/admin/templates`.
2. Confirm default templates exist for `application_submitted`, `status_changed`, `document_requested`, `document_accepted`, `loan_approved`, `loan_denied`, `rate_lock_expiring`, `task_assigned`, and `condition_added`.
3. Edit a subject/body, save, refresh, and verify the changes persist.
4. Disable one template, trigger its event, and verify no email is sent for that event.

## Triggered Emails

1. Submit a borrower application and verify the borrower receives the `application_submitted` email.
2. Request a document from staff and verify the borrower receives the `document_requested` email.
3. Accept a document and verify the borrower receives the `document_accepted` email.
4. Make an underwriting approval or denial and verify the borrower receives the matching approval or denial email.

## Webhook

1. POST a sample payload to `/api/webhooks/resend`.
2. Verify the route responds with `{ "received": true }` and does not error on valid JSON.
