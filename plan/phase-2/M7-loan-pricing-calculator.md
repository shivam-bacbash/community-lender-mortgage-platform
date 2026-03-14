# M7 — Loan Pricing Calculator
> Phase 2 · Real-time rate calculation, fee disclosure, and rate lock management.

## Prerequisites
- M3 complete
- DB tables: `loan_products`, `rate_sheets`, `loan_fees`, `rate_locks`

---

## Goal
Build the pricing engine: rate sheet management, real-time rate calculation based on borrower profile, fee itemization (LE/CD format), and rate lock workflow.

---

## Routes to Build

```
app/(staff)/loans/[id]/pricing/
└── page.tsx                  # Pricing workscreen

app/(admin)/settings/products/
├── page.tsx                  # Loan product list
└── [productId]/
    ├── page.tsx              # Product detail + rate sheet upload
    └── rates/
        └── page.tsx          # Rate matrix editor
```

---

## 1. Rate Calculation Engine

```ts
// lib/pricing/calculator.ts

interface PricingInput {
  loanAmount: number
  creditScore: number
  ltv: number
  loanType: string
  termMonths: number
  occupancyType: string
  propertyType: string
}

interface PricingResult {
  rate: number
  apr: number
  monthlyPayment: number
  points: number
  availableProducts: ProductRate[]
}

export async function calculateRate(input: PricingInput, orgId: string): Promise<PricingResult> {
  // 1. Find active rate sheet for matching product
  const rateSheet = await getActiveRateSheet(input.loanType, orgId)

  // 2. Find rate bucket from LTV × FICO matrix
  const ltvBucket = getLTVBucket(input.ltv)     // e.g. 'ltv_80'
  const ficoBucket = getFICOBucket(input.creditScore) // e.g. 'fico_740'
  const key = `${ltvBucket}_${ficoBucket}`

  const baseRate = rateSheet.rate_data[key]?.rate || null
  if (!baseRate) throw new Error('No rate available for this profile')

  // 3. Apply adjustors (property type, occupancy, loan amount)
  const adjustedRate = applyPriceAdjustors(baseRate, input)

  // 4. Add margin
  const finalRate = adjustedRate + rateSheet.margin

  return {
    rate: finalRate,
    apr: calculateAPR(finalRate, input.loanAmount, totalFees),
    monthlyPayment: calculateMonthlyPayment(finalRate, input.loanAmount, input.termMonths),
    points: rateSheet.rate_data[key]?.points || 0
  }
}

function calculateMonthlyPayment(rate: number, principal: number, termMonths: number): number {
  const monthlyRate = rate / 100 / 12
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths))
}
```

---

## 2. Fee Management (LE Format)

```ts
// Default fee template per loan type
const DEFAULT_FEES = {
  conventional: [
    { fee_type: 'origination',    fee_name: 'Origination Fee',    amount: 1500, disclosure_section: 'A', tolerance_bucket: 'zero' },
    { fee_type: 'appraisal',      fee_name: 'Appraisal Fee',      amount: 550,  disclosure_section: 'B', tolerance_bucket: 'ten_percent' },
    { fee_type: 'credit_report',  fee_name: 'Credit Report',      amount: 75,   disclosure_section: 'B', tolerance_bucket: 'zero' },
    { fee_type: 'flood_cert',     fee_name: 'Flood Determination', amount: 20,   disclosure_section: 'B', tolerance_bucket: 'zero' },
    { fee_type: 'title_search',   fee_name: 'Title Search',       amount: 200,  disclosure_section: 'C', tolerance_bucket: 'ten_percent' },
    { fee_type: 'title_insurance',fee_name: 'Lender Title Insurance', amount: 850, disclosure_section: 'B', tolerance_bucket: 'ten_percent' },
  ]
}
// Server action: applyDefaultFees(loanId, loanType) → bulk insert into loan_fees
```

---

## 3. Pricing Workscreen UI

```
┌─────────────────────────────────────────────┐
│  Loan Pricing — LN-2026-00042               │
├─────────────┬───────────────────────────────┤
│ Profile     │ Rate Results                  │
│ Amount: $400k│ ┌─────────────────────────┐  │
│ LTV: 80%    │ │ 30yr Fixed Conventional  │  │
│ FICO: 740   │ │ Rate: 6.875%  APR: 7.12% │  │
│ Type: Conv  │ │ P&I: $2,628/mo           │  │
│             │ │ Points: 0                │  │
│ [Recalculate]│ │ [Lock Rate]             │  │
└─────────────┴─┴─────────────────────────────┘
│ Fee Itemization (Loan Estimate format)      │
│ Section A — Origination Charges      $1,500 │
│ Section B — Services (Required)      $  645 │
│ Section C — Services (Optional)      $  200 │
│ Total Closing Costs:                 $2,345 │
│ Cash to Close:                      $82,345 │
└─────────────────────────────────────────────┘
```

---

## 4. Rate Lock Flow

```ts
// Server action: lockRate(loanId, rate, lockPeriodDays)
// 1. INSERT into rate_locks with expires_at = now() + lockPeriodDays
// 2. UPDATE loan_applications.status if needed
// 3. INSERT audit_log
// 4. Send confirmation email to borrower

// Expiry monitoring (Edge Function):
// Daily: check rate_locks WHERE expires_at < now() + '3 days'
// INSERT notifications for LO
```

---

## Acceptance Criteria
- [ ] Rate calculator returns rate based on LTV × FICO matrix
- [ ] Monthly payment calculated correctly
- [ ] Default fees auto-populated on loan creation
- [ ] Pricing workscreen shows rate + APR + monthly payment + fees
- [ ] Rate lock stores expiry date and alerts LO before expiry
- [ ] Admin can edit rate sheet matrix
