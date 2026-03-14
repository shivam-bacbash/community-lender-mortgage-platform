# M13 — Reporting & Analytics
> Phase 3 · Loan performance reports, pipeline velocity, profitability, HMDA export.

## Prerequisites
- M3, M9 complete
- DB tables: `loan_applications`, `audit_logs`, `hmda_records`, `loan_fees`, `analytics_events`

---

## Goal
Build comprehensive reporting: LO performance, pipeline velocity, cost-per-loan, application funnel, and HMDA LAR export.

---

## Routes to Build

```
app/(admin)/reports/
├── page.tsx                  # Report hub
├── pipeline/
│   └── page.tsx              # Pipeline velocity + time-to-close
├── production/
│   └── page.tsx              # LO production + volume
├── profitability/
│   └── page.tsx              # Revenue per loan, cost analysis
└── hmda/
    └── page.tsx              # HMDA LAR export
```

---

## Key Reports

### 1. Pipeline Velocity
```ts
// Average days per pipeline stage
const stageVelocity = await supabase.rpc('calculate_stage_velocity', {
  org_id: orgId,
  start_date: startDate,
  end_date: endDate
})
// Returns: [{ stage_name, avg_days, median_days, loan_count }]

// Supabase RPC (SQL function):
// SELECT ps.name, AVG(EXTRACT(EPOCH FROM (la.updated_at - la.submitted_at))/86400) as avg_days
// FROM loan_applications la JOIN pipeline_stages ps ON ps.id = la.pipeline_stage_id
// GROUP BY ps.name, ps.order_index ORDER BY ps.order_index
```

### 2. LO Production Dashboard
```tsx
// Metrics per LO for selected period:
// - Applications received
// - Loans funded
// - Total volume ($)
// - Average time to close (days)
// - Pull-through rate (funded / submitted)
// - Average loan amount

// TanStack Table: one row per LO, sortable by any metric
```

### 3. Application Funnel
```ts
// Funnel visualization: Submitted → Processing → UW → Approved → Funded
// Conversion rate at each stage
// Drop-off analysis (where loans die most)
// Data source: analytics_events + loan_applications status history from audit_logs
```

### 4. HMDA LAR Export
```ts
// Generate HMDA Loan Application Register (LAR) for a reporting year
// Format: pipe-delimited flat file per CFPB spec
// Columns: LEI, ULI, application_date, loan_type, action_taken, ...

export async function generateHMDAExport(orgId: string, year: number): Promise<string> {
  const { data: records } = await supabase
    .from('hmda_records')
    .select('*, loan:loan_applications(*,properties(*),borrower_profiles(*))')
    .eq('organization_id', orgId)
    .eq('reporting_year', year)

  const lines = records.map(mapToLARFormat)
  return lines.join('\n')
}

// Download button → generates file → triggers browser download
```

---

## Chart Components

```tsx
// All charts use Recharts (already in stack)
// components/reports/
├── FunnelChart.tsx            // Application funnel
├── StageVelocityBar.tsx       // Avg days per stage
├── LOProductionTable.tsx      // TanStack Table for LO metrics
├── VolumeTimelineChart.tsx    // Monthly loan volume trend
└── ProfitabilityBreakdown.tsx // Revenue vs cost per loan
```

---

## Acceptance Criteria
- [ ] Pipeline velocity report shows avg days per stage
- [ ] LO production report shows volume, count, pull-through per LO
- [ ] Application funnel shows stage-by-stage conversion rates
- [ ] Date range filter works on all reports
- [ ] HMDA LAR export generates correct pipe-delimited file
- [ ] Reports only show data for the user's organization

---

---

# M14 — Secondary Market Integration
> Phase 3 · GSE loan delivery (FNMA/FHLMC), MISMO file generation, investor reporting.

## Prerequisites
- M6, M7, M12 complete
- DB tables: `secondary_market_loans`, `loan_applications`, `rate_locks`

---

## Goal
Enable community lenders to sell loans on the secondary market: FNMA/FHLMC eligibility checks, MISMO 3.4 file generation, commitment tracking, and investor reporting.

---

## Routes to Build

```
app/(admin)/secondary-market/
├── page.tsx                  # Loan delivery pipeline
└── [loanId]/
    └── page.tsx              # Individual loan delivery detail
```

---

## 1. GSE Eligibility Check

```ts
// lib/secondary-market/eligibility.ts
export function checkGSEEligibility(loan: LoanData): GSEEligibilityResult {
  const fnmaChecks = [
    { name: 'Conforming loan limit', passed: loan.loanAmount <= 806500 },
    { name: 'Min credit score',      passed: loan.creditScore >= 620 },
    { name: 'Max DTI',               passed: loan.dti <= 0.45 },
    { name: 'Max LTV',               passed: loan.ltv <= 0.97 },
    { name: 'Property type allowed', passed: FNMA_ALLOWED_TYPES.includes(loan.propertyType) },
  ]
  return {
    eligible: fnmaChecks.every(c => c.passed),
    investor: 'FNMA',
    checks: fnmaChecks,
    recommendedDeliveryMethod: loan.loanAmount > 500000 ? 'whole_loan' : 'mbs'
  }
}
```

---

## 2. MISMO 3.4 File Generation

```ts
// lib/secondary-market/mismo.ts
// Generate ULAD (Uniform Loan Application Dataset) XML in MISMO 3.4 format
// This is the standard format for GSE loan delivery

export async function generateMISMOFile(loanId: string): Promise<string> {
  const loan = await fetchFullLoanData(loanId)
  const xml = buildMISMOXML(loan)

  // Store in Supabase Storage
  const path = `mismo/${loan.organization_id}/${loanId}/loan-${loan.loanNumber}.xml`
  await supabase.storage.from('documents').upload(path, xml)

  // Update secondary_market_loans
  await supabase.from('secondary_market_loans')
    .update({ mismo_file_path: path })
    .eq('loan_application_id', loanId)

  return path
}
```

---

## 3. Commitment & Delivery Tracking

```tsx
// Delivery pipeline table:
// Columns: loan number, borrower, amount, investor, commitment #, delivery date, status
// Actions: Generate MISMO | Mark Delivered | Record Purchase Price
// Status flow: pending → committed → delivered → purchased

// Server action: recordCommitment(loanId, investorName, commitmentNumber, deliveryDate, purchasePrice)
// Server action: markDelivered(loanId)
// Server action: recordPurchase(loanId, purchasedAt)
```

---

## 4. Investor Reporting

```ts
// Monthly investor report:
// - Loans delivered this month
// - Total UPB (unpaid principal balance)
// - Weighted average rate
// - Weighted average LTV
// - Pool-level summary
// Export as Excel via SheetJS
```

---

## Acceptance Criteria
- [ ] FNMA/FHLMC eligibility check runs on approved loans
- [ ] Ineligible loans show specific failed check with explanation
- [ ] MISMO 3.4 XML generated and stored in Supabase Storage
- [ ] Delivery pipeline tracks commitment → delivered → purchased
- [ ] Purchase price recorded against each delivered loan
- [ ] Monthly investor report exports correctly
