# M6 — Underwriting Engine
> Phase 2 · Rule-based automated underwriting with configurable thresholds per loan type.

## Prerequisites
- M3, M4 complete
- DB tables: `underwriting_rules`, `underwriting_decisions`, `credit_reports`, `conditions`, `loan_applications`

---

## Goal
Build a configurable rules engine that automatically evaluates loan applications against underwriting guidelines, produces a pass/fail/refer result per rule, and feeds into the AI underwriting summary.

---

## Routes to Build

```
app/(admin)/settings/underwriting/
└── page.tsx                  # Configure rules per loan type

app/(staff)/loans/[id]/underwriting/
└── page.tsx                  # UW workscreen (enhanced from M3)
```

---

## Rules Engine

### Rule evaluation
```ts
// lib/underwriting/engine.ts

interface UWRule {
  rule_name: string
  rule_config: { min?: number; max?: number; values?: string[] }
  loan_type: string
}

interface UWResult {
  rule_name: string
  passed: boolean
  actual_value: number | string
  threshold: string
  severity: 'hard_stop' | 'advisory'
}

export async function evaluateLoan(loanId: string, orgId: string): Promise<UWResult[]> {
  // 1. Fetch all active rules for this org + loan type
  const rules = await fetchRules(orgId, loanType)

  // 2. Compute values from loan data
  const values = await computeLoanValues(loanId)
  // values: { dti, ltv, cltv, credit_score, months_reserves, loan_amount }

  // 3. Evaluate each rule
  return rules.map(rule => evaluateRule(rule, values))
}

function evaluateRule(rule: UWRule, values: Record<string, number>): UWResult {
  const value = values[rule.rule_name]
  const { min, max } = rule.rule_config
  const passed = (!min || value >= min) && (!max || value <= max)
  return { rule_name: rule.rule_name, passed, actual_value: value,
           threshold: `${min ? `min: ${min}` : ''}${max ? ` max: ${max}` : ''}`,
           severity: HARD_STOP_RULES.includes(rule.rule_name) ? 'hard_stop' : 'advisory' }
}

// Hard stops — any failure = automatic deny
const HARD_STOP_RULES = ['min_credit_score', 'max_ltv', 'max_loan_amount']
```

### Default rules seeded per org
```ts
// Seeded on org creation for conventional loans:
const DEFAULT_RULES = [
  { rule_name: 'min_credit_score',   rule_config: { min: 620 },   loan_type: 'conventional' },
  { rule_name: 'max_dti',            rule_config: { max: 0.45 },  loan_type: 'conventional' },
  { rule_name: 'max_ltv',            rule_config: { max: 0.97 },  loan_type: 'conventional' },
  { rule_name: 'min_months_reserves',rule_config: { min: 2 },     loan_type: 'conventional' },
  { rule_name: 'min_credit_score',   rule_config: { min: 580 },   loan_type: 'fha' },
  { rule_name: 'max_dti',            rule_config: { max: 0.57 },  loan_type: 'fha' },
  { rule_name: 'max_ltv',            rule_config: { max: 0.965 }, loan_type: 'fha' },
]
```

---

## Admin UI — Rule Configuration

```tsx
// app/(admin)/settings/underwriting/page.tsx
// Tab per loan type: Conventional | FHA | VA | USDA | Jumbo
// Table of rules with inline edit for min/max values
// Toggle is_active per rule
// Add custom rule button
```

---

## UW Workscreen (enhanced from M3)

Add to `/loans/[id]/underwriting/page.tsx`:
- **Automated UW Results panel** — table of all rules with pass/fail chips
- Hard stops highlighted in red with "Cannot Approve" badge
- Advisory failures in amber
- All rules passed → "Eligible for Approval" green banner
- **Run Automated UW** button → calls `evaluateLoan()` + stores result
- UW decision form (from M3) pre-filled with recommendation from engine

---

## Credit Report Integration (mock for Phase 2)

```ts
// lib/integrations/credit.ts
// Phase 2: mock credit pull — returns realistic fake data
// Phase 3: replace with real Experian/Equifax/TU API

export async function pullCreditReport(borrowerProfileId: string, loanId: string) {
  const mockReport = {
    score: 720 + Math.floor(Math.random() * 80),  // 720-800
    bureau: 'tri_merge',
    report_data: { /* mock tradelines */ }
  }
  await supabase.from('credit_reports').insert({ ...mockReport, borrower_profile_id: borrowerProfileId, loan_application_id: loanId, pulled_at: new Date() })
  return mockReport
}
```

---

## Acceptance Criteria
- [ ] Rules engine evaluates all active rules for a loan
- [ ] Hard stop failures prevent approval (UI blocks decision form)
- [ ] Admin can configure rule thresholds per loan type
- [ ] Automated UW result stored and shown in UW tab
- [ ] Credit report mock pull works and stores score
- [ ] DTI and LTV computed correctly from loan data
