# M9 — Compliance Management
> Phase 2 · TRID timeline tracking, QM eligibility, HMDA data collection, full audit trail.

## Prerequisites
- M2, M3, M6 complete
- DB tables: `disclosures`, `hmda_records`, `audit_logs`, `loan_applications`

---

## Goal
Automate compliance tracking: TRID 3/7 business day rules for disclosures, QM eligibility checks, HMDA data collection at loan disposition, and a read-only audit trail UI.

---

## Routes to Build

```
app/(staff)/loans/[id]/compliance/
└── page.tsx                  # Compliance dashboard per loan

app/(admin)/compliance/
├── page.tsx                  # Org-wide compliance overview
└── audit/
    └── page.tsx              # Full audit log viewer
```

---

## 1. TRID Disclosure Tracking

### Business day calculation
```ts
// lib/compliance/trid.ts
// TRID uses "business days" = Mon–Sat excluding federal holidays

const FEDERAL_HOLIDAYS_2026 = ['2026-01-01', '2026-01-19', /* ... */]

export function addBusinessDays(startDate: Date, days: number): Date {
  let count = 0
  let current = new Date(startDate)
  while (count < days) {
    current.setDate(current.getDate() + 1)
    const dayOfWeek = current.getDay()
    const dateStr = current.toISOString().split('T')[0]
    if (dayOfWeek !== 0 && !FEDERAL_HOLIDAYS_2026.includes(dateStr)) count++
  }
  return current
}
```

### Disclosure creation
```ts
// Server action: issueDisclosure(loanId, type: 'LE'|'CD')
// LE (Loan Estimate): must be sent within 3 business days of application
// CD (Closing Disclosure): must be sent 3 business days before closing

const deadline = type === 'LE'
  ? addBusinessDays(submittedAt, 3)
  : addBusinessDays(closingDate, -3)

await supabase.from('disclosures').insert({
  loan_application_id: loanId,
  disclosure_type: type,
  sent_at: new Date(),
  deadline,
  status: 'sent'
})
```

### TRID status indicators
```tsx
// components/compliance/TRIDTracker.tsx
// Shows timeline: Application → LE (3 days) → Intent to Proceed → CD (3 days) → Closing
// Red if deadline missed, amber if due today/tomorrow, green if acknowledged
```

---

## 2. QM Eligibility Check

```ts
// lib/compliance/qm.ts
export function checkQMEligibility(loan: LoanData): QMResult {
  const checks = [
    { name: 'Max DTI',     passed: loan.dti <= 0.43,           value: loan.dti },
    { name: 'Max Points',  passed: loan.points <= 3,            value: loan.points },
    { name: 'Max Term',    passed: loan.termMonths <= 360,       value: loan.termMonths },
    { name: 'No IO/Neg-Am',passed: loan.amortization === 'fixed',value: loan.amortization },
    { name: 'Max Loan',    passed: loan.loanAmount <= 726200,    value: loan.loanAmount },
  ]
  return {
    isQM: checks.every(c => c.passed),
    isHPML: loan.apr - loan.apor > 1.5,    // Higher-Priced Mortgage Loan
    isHOEPA: loan.apr - loan.apor > 8,
    checks
  }
}
```

---

## 3. HMDA Data Collection

```ts
// Server action: recordHMDAData(loanId)
// Triggered automatically when loan reaches terminal status (funded/denied/withdrawn)

await supabase.from('hmda_records').upsert({
  loan_application_id: loanId,
  organization_id: orgId,
  action_taken: mapStatusToHMDACode(loan.status),
  action_taken_date: new Date().toISOString().split('T')[0],
  census_tract: await getCensusTract(property.address),
  reporting_year: new Date().getFullYear(),
  // Demographic data collected separately via voluntary borrower form
})
```

---

## 4. Audit Trail UI

```tsx
// app/(admin)/compliance/audit/page.tsx
// TanStack Table with server-side pagination
// Columns: timestamp, actor, action, resource, before/after diff
// Filters: date range, actor, action type, resource type
// Export to CSV button

const { data: logs } = await supabase
  .from('audit_logs')
  .select('*, actor:profiles(first_name, last_name, role)')
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .range(offset, offset + pageSize)
```

---

## Acceptance Criteria
- [ ] LE deadline calculated correctly (3 business days from submission)
- [ ] CD deadline calculated correctly (3 business days before closing)
- [ ] TRID tracker shows red/amber/green per milestone
- [ ] QM eligibility check runs on UW decision
- [ ] HMDA record created automatically at loan disposition
- [ ] Audit log shows all state changes with before/after diff
- [ ] Audit log is read-only in UI (no edit/delete buttons)
