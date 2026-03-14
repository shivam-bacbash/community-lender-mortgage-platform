# M4 — AI Pre-qualification
> Phase 1 · The WOW factor. Differentiates from all competitors. Triggered automatically on application submit.

## Prerequisites
- M1 (Auth) complete
- M2 (Borrower Portal) complete — loan application data exists
- M3 (LO Dashboard) complete — AI card displayed in loan detail
- DB tables: `loan_applications`, `borrower_profiles`, `employment_records`, `assets`, `liabilities`, `properties`, `underwriting_decisions`, `ai_analyses`
- Env: `ANTHROPIC_API_KEY` set

---

## Goal
On every application submission, automatically run 3 AI analyses using the Claude API:
1. **Pre-qualification score** — shown to borrower immediately
2. **Underwriting summary** — shown to loan officer on pipeline card + detail view
3. **Compliance check** — flags any regulatory concerns

All results stored in `ai_analyses` (append-only) and surfaced in the UI.

---

## DB Tables Used

| Table | Operation |
|---|---|
| `ai_analyses` | INSERT (append-only, never update) |
| `loan_applications` | READ — full application context |
| `borrower_profiles` | READ — PII-safe fields only |
| `employment_records` | READ |
| `assets` | READ |
| `liabilities` | READ |
| `properties` | READ |
| `fraud_flags` | INSERT — if AI detects anomalies |

---

## Architecture

```
Application Submit (M2 Server Action)
    │
    ├── 1. Save to DB (synchronous)
    ├── 2. Redirect borrower to status page
    └── 3. Trigger AI analyses (async — do not await in request)
              │
              ├── analyzePrequalification()  → ai_analyses row (type: prequalification)
              ├── analyzeUnderwriting()       → ai_analyses row (type: underwriting_summary)
              └── analyzeCompliance()         → ai_analyses row (type: compliance_check)
```

Use `Promise.allSettled()` to run all 3 in parallel. Never block the user's redirect.

---

## Implementation

### `lib/ai/claude.ts` — Base client

```ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1024
): Promise<string> {
  const startMs = Date.now()
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  })
  return {
    text: response.content[0].type === 'text' ? response.content[0].text : '',
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    latencyMs: Date.now() - startMs
  }
}
```

---

### `lib/ai/analyses.ts` — Analysis functions

#### 1. Pre-qualification Analysis

```ts
export async function analyzePrequalification(loanId: string, orgId: string) {
  // 1. Build input snapshot (never include SSN, DOB in AI payload)
  const snapshot = await buildApplicationSnapshot(loanId)

  const systemPrompt = `
You are a mortgage underwriting AI assistant for a community lender.
Analyze this loan application and return ONLY valid JSON with this exact structure:
{
  "score": <integer 0-100>,
  "recommendation": <"likely_approve" | "needs_review" | "high_risk">,
  "strengths": [<string>, <string>],
  "concerns": [<string>],
  "flags": [<string>],
  "rationale": <string max 150 words>,
  "estimated_dti": <number>,
  "estimated_ltv": <number>
}
Base your analysis on industry standard underwriting guidelines.
Be factual, concise, and fair. Do not discriminate based on protected classes.
Return only the JSON object, no markdown, no explanation.
`

  const userPrompt = JSON.stringify(snapshot)

  const { text, tokensUsed, latencyMs } = await callClaude(systemPrompt, userPrompt)

  // 2. Parse result
  const result = JSON.parse(text)

  // 3. Store in ai_analyses (append-only)
  const { data } = await supabase.from('ai_analyses').insert({
    loan_application_id: loanId,
    analysis_type: 'prequalification',
    model_used: 'claude-sonnet-4-6',
    triggered_by: 'auto',
    input_snapshot: snapshot,
    result,
    confidence_score: result.score / 100,
    tokens_used: tokensUsed,
    latency_ms: latencyMs,
    status: 'completed'
  }).select().single()

  // 4. If flags detected, create fraud_flags
  if (result.flags.length > 0) {
    await createFraudFlags(loanId, data.id, result.flags)
  }

  return result
}
```

#### 2. Underwriting Summary (for Loan Officer)

```ts
export async function analyzeUnderwriting(loanId: string) {
  const snapshot = await buildApplicationSnapshot(loanId)

  const systemPrompt = `
You are a senior mortgage underwriter. Analyze this application and return ONLY valid JSON:
{
  "risk_score": <integer 0-100>,
  "recommendation": <"approve" | "approve_with_conditions" | "suspend" | "deny">,
  "strengths": [<string>, <string>, <string>],
  "concerns": [<string>, <string>],
  "suggested_conditions": [<string>],
  "key_ratios": {
    "dti": <number>,
    "ltv": <number>,
    "credit_score_adequacy": <"strong" | "adequate" | "marginal" | "insufficient">
  },
  "executive_summary": <string max 200 words>
}
This summary is for the loan officer's review, not the borrower.
Return only the JSON object.
`

  const { text, tokensUsed, latencyMs } = await callClaude(systemPrompt, JSON.stringify(snapshot), 1500)
  const result = JSON.parse(text)

  await supabase.from('ai_analyses').insert({
    loan_application_id: loanId,
    analysis_type: 'underwriting_summary',
    model_used: 'claude-sonnet-4-6',
    triggered_by: 'auto',
    input_snapshot: snapshot,
    result,
    confidence_score: result.risk_score / 100,
    tokens_used: tokensUsed,
    latency_ms: latencyMs,
    status: 'completed'
  })

  return result
}
```

#### 3. Compliance Check

```ts
export async function analyzeCompliance(loanId: string) {
  const snapshot = await buildApplicationSnapshot(loanId)

  const systemPrompt = `
You are a mortgage compliance officer. Check this application for regulatory concerns.
Return ONLY valid JSON:
{
  "compliance_status": <"clear" | "review_required" | "flag">,
  "issues": [
    {
      "type": <string>,
      "description": <string>,
      "severity": <"low" | "medium" | "high">,
      "regulation": <string>
    }
  ],
  "trid_concerns": [<string>],
  "fair_lending_notes": <string>
}
Check for: TRID timing requirements, QM eligibility, HOEPA triggers,
fair lending concerns, ATR compliance.
Return only the JSON object.
`

  const { text, tokensUsed, latencyMs } = await callClaude(systemPrompt, JSON.stringify(snapshot))
  const result = JSON.parse(text)

  await supabase.from('ai_analyses').insert({
    loan_application_id: loanId,
    analysis_type: 'compliance_check',
    model_used: 'claude-sonnet-4-6',
    triggered_by: 'auto',
    input_snapshot: snapshot,
    result,
    tokens_used: tokensUsed,
    latency_ms: latencyMs,
    status: 'completed'
  })

  return result
}
```

---

### `lib/ai/snapshot.ts` — Build safe input payload

```ts
// IMPORTANT: Never include SSN, full DOB, or raw account numbers in AI payload
export async function buildApplicationSnapshot(loanId: string) {
  const { data } = await supabase
    .from('loan_applications')
    .select(`
      loan_amount, loan_purpose, loan_type, loan_amount, down_payment, term_months,
      properties(property_type, occupancy_type, purchase_price, estimated_value),
      borrower_profiles(
        marital_status, citizenship, years_at_address, housing_status,
        monthly_housing_payment, dependents_count
      ),
      employment_records(
        employment_type, is_current, is_primary,
        base_monthly_income, overtime_monthly, bonus_monthly,
        commission_monthly, start_date
      ),
      assets(asset_type, balance, is_gift),
      liabilities(liability_type, monthly_payment, outstanding_balance, to_be_paid_off)
    `)
    .eq('id', loanId)
    .single()

  // Compute derived fields for AI context
  const totalMonthlyIncome = data.employment_records
    .filter(e => e.is_current)
    .reduce((sum, e) => sum + e.base_monthly_income + e.overtime_monthly + e.bonus_monthly, 0)

  const totalMonthlyDebts = data.liabilities
    .filter(l => !l.to_be_paid_off)
    .reduce((sum, l) => sum + l.monthly_payment, 0)

  const totalAssets = data.assets.reduce((sum, a) => sum + a.balance, 0)
  const ltv = data.loan_amount / (data.properties?.purchase_price || 1)
  const dti = (totalMonthlyDebts + estimatedPITI(data)) / totalMonthlyIncome

  return {
    loan: {
      amount: data.loan_amount,
      purpose: data.loan_purpose,
      type: data.loan_type,
      term_months: data.term_months,
      down_payment: data.down_payment,
      ltv: Math.round(ltv * 1000) / 10,        // as percentage
      estimated_dti: Math.round(dti * 1000) / 10
    },
    property: data.properties,
    borrower: {
      ...data.borrower_profiles[0],
      years_employed: calculateYearsEmployed(data.employment_records),
      employment_type: data.employment_records[0]?.employment_type,
      total_monthly_income: totalMonthlyIncome,
      total_assets: totalAssets,
      total_monthly_debts: totalMonthlyDebts,
      months_reserves: totalAssets / estimatedPITI(data)
    }
  }
}

function estimatedPITI(data: any): number {
  // Rough PITI: P&I + estimated taxes + insurance
  const rate = 0.07                          // 7% default rate for estimation
  const monthlyPI = data.loan_amount * (rate / 12) /
    (1 - Math.pow(1 + rate / 12, -data.term_months))
  return monthlyPI * 1.25                    // add 25% for T&I estimate
}
```

---

## UI Components

### `components/loan/AIPrequalCard.tsx` (Borrower-facing)
```tsx
// Shows on /loans/[id] status page
// Fetches latest ai_analyses where analysis_type = 'prequalification'
// Loading state: skeleton while analysis runs (poll every 3s for up to 30s)

<AIPrequalCard
  score={78}
  recommendation="likely_approve"
  strengths={["Strong stable income", "Low debt-to-income ratio"]}
  concerns={["Thin credit file"]}
  disclaimer="This is an automated pre-assessment, not a final credit decision."
/>
```

Score visual: circular progress ring (green 70+, amber 50–69, red <50)

### `components/loan/AIUnderwritingCard.tsx` (Staff-facing)
```tsx
// Shows on LO dashboard loan detail → Underwriting tab
// Full AI summary with risk score, recommendation, suggested conditions
// "Re-run Analysis" button → calls analyzeUnderwriting() manually
```

### `components/pipeline/AIScoreBadge.tsx` (Kanban card)
```tsx
// Small badge on kanban LoanCard
// Shows score number with color (78 in green)
// Tooltip shows recommendation on hover
```

---

## Trigger Points

| Trigger | Analysis types | Who sees it |
|---|---|---|
| Application submitted (auto) | prequalification + underwriting_summary + compliance_check | Borrower sees prequal; LO sees UW summary |
| LO clicks "Re-run Analysis" (manual) | underwriting_summary | LO only |
| Document uploaded (auto, Phase 2) | document_extraction | LO only |

---

## Error Handling

```ts
// Always wrap Claude API calls
try {
  const result = await analyzePrequalification(loanId, orgId)
} catch (error) {
  // Store failed analysis in ai_analyses with status='failed'
  await supabase.from('ai_analyses').insert({
    loan_application_id: loanId,
    analysis_type: 'prequalification',
    status: 'failed',
    error_message: error instanceof Error ? error.message : 'Unknown error',
    input_snapshot: snapshot,
    result: {}
  })
  // Do NOT surface error to borrower — just don't show the card
}
```

---

## Acceptance Criteria

- [ ] Pre-qualification analysis runs automatically on application submit
- [ ] Score, recommendation, strengths, and concerns stored in `ai_analyses`
- [ ] Borrower sees AI pre-qual card on `/loans/[id]` within 30 seconds
- [ ] LO sees AI underwriting summary on loan detail → Underwriting tab
- [ ] AI score badge visible on kanban LoanCard
- [ ] "Re-run Analysis" button works from LO view
- [ ] Failed analyses stored with `status='failed'` — no crash
- [ ] Input snapshot never contains SSN, raw DOB, or full account numbers
- [ ] Every analysis stored in `ai_analyses` before being shown in UI

---

## Feeds Into
- M3 (LO Dashboard) — AI cards in pipeline + loan detail
- M15 (Fraud Detection) — fraud flags from compliance_check
- M16 (Predictive Analytics) — ai_analyses data used for portfolio analytics
