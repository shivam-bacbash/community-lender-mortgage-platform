# M12 — Closing & Title · Test Plan

## Scope
Closing coordination workscreen, e-sign envelope management, funding checklist, and DocuSign/HelloSign webhook handlers.

---

## 1. Closing Order — Schedule & Edit

| # | Step | Expected |
|---|------|----------|
| 1.1 | Navigate to `/staff/loans/:id/closing` as a loan officer | Page loads; closing timeline shows no active step; form is empty |
| 1.2 | Submit form with title company name, phone, settlement agent, closing date, location type = `in_person`, and address | `scheduleClosing` action runs; closing_orders row inserted with status = `scheduled`; timeline highlights step 1 |
| 1.3 | Reload the page | Form is pre-populated with the saved values |
| 1.4 | Change closing date and resubmit | Row updated (not duplicated); borrower receives "Your closing has been scheduled" notification |
| 1.5 | Select location type = `remote` | Video link field appears; address field is hidden |
| 1.6 | Select location type = `hybrid` | Both address and video link fields are visible |
| 1.7 | Try to access `/staff/loans/:id/closing` as a borrower | Redirected to login or 403 |

---

## 2. E-Sign Envelope Management

| # | Step | Expected |
|---|------|----------|
| 2.1 | Click "Send for signature" → select `initial_disclosures` → confirm | Row inserted in esign_envelopes with status = `sent`, provider = `docusign`; borrower notification sent |
| 2.2 | Envelope appears in the envelope table | Signed event, provider, status badge, sent_at all displayed correctly |
| 2.3 | Send a second envelope for `closing_docs` | Two rows visible; each with correct signing_event label |
| 2.4 | Click void on an envelope → enter reason → confirm | Row updated: status = `voided`, voided_at set, void_reason stored; audit log entry created |
| 2.5 | Try to void an already-voided envelope | UI should either hide the void action or show an appropriate error |

---

## 3. DocuSign Webhook

| # | Step | Expected |
|---|------|----------|
| 3.1 | POST to `/api/webhooks/docusign` with `{"envelopeId":"MOCK-ENV-xxx","status":"completed"}` and no signature header | Returns 200 `{ received: true }`; esign_envelopes.status updated to `completed`, completed_at set |
| 3.2 | POST with `status: "declined"` | esign_envelopes.status = `declined` |
| 3.3 | POST with unknown envelopeId | Returns 200 (prevents retries); no DB change |
| 3.4 | POST with invalid HMAC signature when `DOCUSIGN_HMAC_KEY` is set | Returns 401 |
| 3.5 | POST with valid HMAC signature | Returns 200; envelope updated; LO notified |

---

## 4. HelloSign Webhook

| # | Step | Expected |
|---|------|----------|
| 4.1 | POST multipart to `/api/webhooks/hellosign` with `json_data` containing `event.event_type = "signature_request_signed"` | Returns `Hello API Event Received`; envelope status = `completed` |
| 4.2 | POST with `event_type = "signature_request_sent"` | Envelope status = `sent` |
| 4.3 | POST with malformed `json_data` | Returns 400 |

---

## 5. Funding Checklist

| # | Step | Expected |
|---|------|----------|
| 5.1 | Closing order exists; checklist shows 8 items, all unchecked | Counter shows `0 / 8` |
| 5.2 | Check one item | `updateFundingChecklist` called; counter updates to `1 / 8`; DB row updated |
| 5.3 | Check all 8 items | Counter shows `8 / 8`; "Mark as Funded" button becomes enabled |
| 5.4 | Uncheck one item | Counter drops; "Mark as Funded" button disabled again |
| 5.5 | Reload page | Checkbox state persisted from DB |

---

## 6. Mark as Funded

| # | Step | Expected |
|---|------|----------|
| 6.1 | All 8 checklist items unchecked | "Mark as Funded" button is disabled |
| 6.2 | All 8 items checked; enter funding amount → click "Mark as Funded" | closing_orders.status = `funded`, funded_at set; loan_applications.status = `funded`; timeline highlights step 4 |
| 6.3 | Borrower receives notification | Notification with title "Your loan has been funded" created |
| 6.4 | Audit log entry created | action = `closing.funded`, resource_type = `closing_order` |
| 6.5 | "Mark as Funded" form replaced by funded confirmation banner | Banner shows funding amount formatted as currency |
| 6.6 | Dashboard and pipeline pages revalidated | Status reflects `funded` without manual refresh |

---

## 7. Audit Logging

| # | Step | Expected |
|---|------|----------|
| 7.1 | After scheduling closing | audit_logs row: action = `closing.scheduled` |
| 7.2 | After sending e-sign | audit_logs row: action = `closing.esign_sent` |
| 7.3 | After voiding envelope | audit_logs rows: action = `closing.esign_voided`, before/after state recorded |
| 7.4 | After marking funded | audit_logs row: action = `closing.funded` |

---

## 8. Navigation

| # | Step | Expected |
|---|------|----------|
| 8.1 | Check loan tabs nav on any staff loan page | "Closing" tab appears after "Messages" |
| 8.2 | Active tab indicator on `/closing` route | "Closing" tab is highlighted |

---

## Acceptance Criteria (from plan)
- [x] Closing order created with title company info + date
- [x] Borrower notified of closing date/time/location
- [x] Documents sent for e-signature via mock DocuSign envelope
- [x] DocuSign webhook updates envelope status + notifies LO on completion
- [x] Funding checklist tracks all 8 pre-funding requirements
- [x] "Mark as Funded" updates loan status to `funded`
- [x] Wire instructions / checklist stored in closing_orders JSONB
