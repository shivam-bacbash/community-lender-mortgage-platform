# M11 — Integrations Layer
> Phase 3 · Third-party service connections: credit bureaus, Plaid, flood determination, AMC ordering.

## Prerequisites
- M5, M6 complete
- DB tables: `credit_reports`, `flood_certifications`, `appraisals`, `assets`

---

## Goal
Replace all Phase 1–2 mocks with real third-party integrations. Each integration is a swappable adapter behind a consistent interface.

---

## Integration Architecture

```ts
// lib/integrations/index.ts
// Adapter pattern — swap mock for real without changing callers

interface CreditAdapter { pull(borrowerProfileId, loanId): Promise<CreditReport> }
interface IncomeAdapter { verify(employmentRecordId): Promise<VerificationResult> }
interface FloodAdapter  { determine(address): Promise<FloodCertification> }
interface AMCAdapter    { order(loanId, propertyId): Promise<AppraisalOrder> }

// Factory: returns mock or real based on env/feature flag
export const credit = process.env.CREDIT_PROVIDER === 'experian'
  ? new ExperianAdapter()
  : new MockCreditAdapter()
```

---

## 1. Credit Bureau — Experian/Equifax/TransUnion

```ts
// lib/integrations/credit/experian.ts
// POST to Experian SmartBusinessLink API
// Parse XML response → store in credit_reports
// Tri-merge: pull all 3, use middle score for qualifying

export class ExperianAdapter implements CreditAdapter {
  async pull(borrowerProfileId: string, loanId: string) {
    const ssn = await decryptSSN(borrowerProfileId)        // pgcrypto decrypt
    const response = await fetch(EXPERIAN_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.EXPERIAN_API_KEY}` },
      body: buildCreditRequest(ssn)
    })
    const parsed = parseCreditXML(await response.text())
    await supabase.from('credit_reports').insert({ ...parsed, borrower_profile_id: borrowerProfileId, loan_application_id: loanId })
    return parsed
  }
}
```

---

## 2. Plaid — Income & Asset Verification

```ts
// lib/integrations/plaid/index.ts
// Plaid Link flow: generate link_token → borrower connects bank → exchange public_token

export async function createPlaidLinkToken(userId: string) {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'NexusLend',
    products: ['assets', 'income_verification'],
    country_codes: ['US'],
    language: 'en'
  })
  return response.data.link_token
}

export async function verifyIncome(publicToken: string, borrowerProfileId: string) {
  const { access_token } = await plaidClient.itemPublicTokenExchange({ public_token: publicToken })
  const income = await plaidClient.incomeVerificationPaystubsGet({ access_token })
  // Parse and update employment_records with verified income
  // Set verified_via = 'plaid', verified_at = now()
}
```

---

## 3. Flood Determination — ServiceLink/CoreLogic

```ts
// lib/integrations/flood/index.ts
export async function determineFloodZone(propertyId: string, address: object) {
  const response = await fetch(FLOOD_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ address }),
    headers: { 'x-api-key': process.env.FLOOD_API_KEY }
  })
  const result = await response.json()
  await supabase.from('flood_certifications').insert({
    property_id: propertyId,
    flood_zone_code: result.zone,
    requires_insurance: ['AE', 'VE', 'A'].includes(result.zone),
    cert_number: result.certNumber,
    determined_at: new Date(),
    provider: 'ServiceLink'
  })
}
```

---

## 4. AMC — Appraisal Management

```ts
// lib/integrations/amc/index.ts
export async function orderAppraisal(loanId: string, propertyId: string) {
  // 1. POST to AMC API with property details
  // 2. Store order confirmation in appraisals table
  // 3. Register webhook URL for status updates
  // 4. AMC sends webhook when appraisal received → update appraisals.status
}

// app/api/webhooks/amc/route.ts
// Handle incoming appraisal completion webhook
// UPDATE appraisals SET status='received', appraised_value=..., received_at=now()
// INSERT notification for LO
```

---

## Acceptance Criteria
- [ ] Credit pull adapter pattern works with mock and real implementations
- [ ] Plaid Link token generated and bank connection flow works
- [ ] Income verified from Plaid and updates employment_records
- [ ] Flood zone determined and stored with insurance requirement flag
- [ ] AMC order placed and webhook updates appraisal status
- [ ] All integrations log to audit_logs
