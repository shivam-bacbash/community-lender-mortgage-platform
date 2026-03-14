# Module 9 Test Plan: Compliance Management

## Preconditions

- Use a staff or admin account with access to an existing submitted loan.
- Use a loan with `submitted_at` populated for LE tests.
- Use a loan with `estimated_closing` populated for CD tests.
- Use a loan that has an underwriting decision and an active rate lock for QM checks.

## Staff Compliance Dashboard

1. Sign in as staff and open `/staff/loans/[loan-id]/compliance`.
2. Verify the TRID timeline renders milestones for application, LE, intent to proceed, CD, and estimated closing.
3. Confirm LE shows a 3-business-day deadline from `submitted_at`.
4. Confirm CD shows a 3-business-day deadline before `estimated_closing`.
5. Verify milestone colors change:
   - green when acknowledged
   - amber when due today or tomorrow
   - red when overdue

## Disclosure Issuance

1. From the compliance page, click `Issue Loan Estimate`.
2. Verify a `disclosures` row is created with `disclosure_type = LE`, `status = sent`, and the correct deadline.
3. Click `Issue Loan Estimate` again and verify the previous LE becomes `superseded` and a new higher-version row is inserted.
4. Repeat for `Issue Closing Disclosure` and verify the deadline is 3 business days before closing.

## QM Eligibility

1. Make or refresh an underwriting decision on the loan.
2. Return to `/staff/loans/[loan-id]/compliance`.
3. Verify the QM card shows pass/fail results for:
   - max DTI
   - max points
   - max term
   - no IO/negative amortization
   - max loan amount
4. Verify HPML and HOEPA flags update based on APR vs APOR.

## HMDA Capture

1. Set the loan to a terminal disposition currently supported by the workflow, such as `denied`.
2. Verify an `hmda_records` row is created or updated automatically for that loan.
3. Confirm `action_taken`, `action_taken_date`, `reporting_year`, and `rate_spread` are populated.
4. Re-open the compliance page and verify the HMDA snapshot renders the saved values.

## Admin Compliance Views

1. Sign in as admin and open `/admin/compliance`.
2. Verify the overview cards render counts for upcoming disclosures, overdue disclosures, HMDA records, and compliance flags.
3. Confirm upcoming disclosures and flagged files lists populate with current org data.
4. Open `/admin/compliance/audit`.
5. Apply actor, action, resource, and date filters and verify the table updates.
6. Confirm the audit table is read-only and exposes no edit or delete controls.
7. Use `Export CSV` and verify the downloaded file contains the filtered audit rows.
