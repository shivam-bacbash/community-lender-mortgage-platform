# Module 7 Test Plan: Loan Pricing Calculator

## Scope
Validate the pricing workflow from `plan/phase-2/M7-loan-pricing-calculator.md`: default product/rate-sheet setup, staff pricing results, fee itemization, rate lock workflow, and admin product/rate matrix management.

## Prerequisites
- Run `npm install`
- Set `.env.local` with Supabase values, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` if email confirmation should be tested
- Start the app with `npm run dev`
- Confirm modules 1 through 6 are already working
- Use seeded users:
  - `loan.officer.demo@nexuslend.local`
  - `admin.demo@nexuslend.local`
  - Password: `Password123!`
- Ensure a submitted or processing loan exists with:
  - borrower profile and property
  - latest credit report
  - non-null `loan_amount`, `down_payment`, and `term_months`

## Core Flows
### 1. Admin product setup
1. Sign in as `admin.demo@nexuslend.local`.
2. Open `/admin/settings/products`.
3. Confirm default products render for conventional, FHA, VA, USDA, and jumbo.
4. Edit one product guideline JSON and save it.
5. Add one custom product.

Expected:
- product list loads without manual seeding
- save persists product changes
- custom product appears after refresh

### 2. Rate matrix editor
1. Open `/admin/settings/products/[productId]`.
2. Confirm the active rate-sheet summary renders.
3. Open `/admin/settings/products/[productId]/rates`.
4. Change one rate cell and one points cell, then save.

Expected:
- matrix editor loads current LTV × FICO values
- save persists the sheet and keeps it active
- returning to the detail page shows updated active sheet metadata

### 3. Staff pricing workscreen
1. Sign in as `loan.officer.demo@nexuslend.local`.
2. Open `/staff/loans/[id]/pricing`.

Expected:
- profile card shows amount, term, FICO, LTV, occupancy, and property type
- rate results render at least one available product
- the best product shows rate, APR, monthly payment, and points
- fee itemization renders LE-style sections and totals

### 4. Fee auto-population
1. Use a loan that has never visited pricing before.
2. Open `/staff/loans/[id]/pricing`.
3. Inspect `loan_fees` in Supabase.

Expected:
- default fees are inserted automatically for the loan type
- totals on the pricing page match the stored rows
- cash to close equals down payment plus closing costs

### 5. Recalculate pricing
1. Modify one rate-sheet cell in admin.
2. Return to `/staff/loans/[id]/pricing`.
3. Click `Recalculate`.

Expected:
- page refreshes to the latest pricing
- updated rate/APR/monthly payment reflect the changed matrix

### 6. Rate lock
1. From `/staff/loans/[id]/pricing`, choose a quoted product.
2. Select a lock period such as 30 days.
3. Click `Lock rate`.

Expected:
- a `rate_locks` row is inserted with `status = active`
- `expires_at` is set based on the selected lock period
- audit log entry is written
- borrower email is sent when Resend is configured
- staff page shows the active lock summary

### 7. Expiry alert job
1. In Supabase, set an active rate lock `expires_at` within 3 days.
2. Deploy and run the `rate-lock-expiry-alerts` function.
3. Check the assigned loan officer notifications.

Expected:
- a `rate_lock_expiring` notification is inserted
- notification deep link points to `/staff/loans/[id]/pricing`

### 8. Missing credit guardrail
1. Use a loan with no `credit_reports` row.
2. Open `/staff/loans/[id]/pricing`.

Expected:
- fee itemization still loads
- pricing panel instructs staff to pull credit or complete profile inputs before pricing
- no crash occurs when pricing inputs are incomplete
