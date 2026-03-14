# M12 — Closing & Title
> Phase 3 · Closing coordination, e-sign integration (DocuSign/HelloSign), title company workflow.

## Prerequisites
- M3, M7, M9 complete
- DB tables: `closing_orders`, `esign_envelopes`, `disclosures`, `documents`

---

## Goal
Manage the closing workflow: coordinate with title companies, generate and send closing documents for e-signature, track funding.

---

## Routes to Build

```
app/(staff)/loans/[id]/closing/
└── page.tsx                  # Closing coordination workscreen

app/api/webhooks/docusign/route.ts      # DocuSign status webhooks
app/api/webhooks/hellosign/route.ts     # HelloSign status webhooks
```

---

## 1. Closing Order Management

```tsx
// app/(staff)/loans/[id]/closing/page.tsx
// Closing timeline: Approval → CTC → CD Issued → Signing → Funding
// Sections:
//   - Title company info (name, phone, settlement agent)
//   - Closing date/time picker
//   - Location: in-person address | remote video link | hybrid
//   - Wire instructions input (encrypted before storing)
//   - Funding checklist
```

```ts
// Server action: scheduleClosing(loanId, data)
// INSERT into closing_orders
// UPDATE loan_applications.estimated_closing
// INSERT notification to borrower with closing date/time/location
// INSERT audit_log
```

---

## 2. E-Sign Integration

```ts
// lib/integrations/esign/docusign.ts
import docusign from 'docusign-esign'

export async function sendForSignature(loanId: string, documentIds: string[], signingEvent: string) {
  // 1. Fetch signed URLs for documents from Supabase Storage
  // 2. Create DocuSign envelope with documents + signature tabs
  // 3. Add recipients (borrower + co-borrower if applicable)
  // 4. Send envelope
  // 5. INSERT into esign_envelopes with envelope_id and status='sent'
  // 6. INSERT notification to borrower

  const envelope = await apiClient.envelopesApi.createEnvelope(accountId, {
    emailSubject: `Please sign your ${signingEvent} documents`,
    documents: documentIds.map(buildDocusignDocument),
    recipients: { signers: buildSigners(loan) },
    status: 'sent'
  })

  await supabase.from('esign_envelopes').insert({
    loan_application_id: loanId,
    provider: 'docusign',
    envelope_id: envelope.envelopeId,
    signing_event: signingEvent,
    status: 'sent',
    sent_at: new Date(),
    document_ids: documentIds
  })
}
```

### DocuSign webhook handler
```ts
// app/api/webhooks/docusign/route.ts
export async function POST(request: Request) {
  const payload = await request.json()
  const { envelopeId, status } = payload

  // UPDATE esign_envelopes SET status=status, completed_at=now() WHERE envelope_id=envelopeId
  // If status === 'completed':
  //   - Download signed documents from DocuSign
  //   - Upload to Supabase Storage
  //   - INSERT into documents table
  //   - INSERT notification to LO
}
```

---

## 3. Closing Document Generation

```ts
// lib/closing/documents.ts
// Generate closing document package:
// - Closing Disclosure (from loan_fees data)
// - Promissory Note
// - Deed of Trust
// - Right of Rescission (refi only)

// For MVP: generate PDF using a template + loan data
// Phase 4: integrate with a document generation service (DocuTech/Wolters Kluwer)
```

---

## 4. Funding Checklist

```tsx
// components/closing/FundingChecklist.tsx
// Checklist items auto-populated based on loan type:
const FUNDING_CHECKLIST = [
  'All conditions satisfied (PTD + PTC)',
  'Closing Disclosure acknowledged (3+ business days)',
  'All documents signed',
  'Wire instructions confirmed',
  'Hazard insurance bound',
  'Flood insurance bound (if required)',
  'Title commitment received',
  'Final inspection complete (construction only)',
]
// Each item: manual checkbox + notes field
// All checked → enable "Mark as Funded" button
```

---

## Acceptance Criteria
- [ ] Closing order created with title company info + date
- [ ] Borrower notified of closing date/time/location
- [ ] Documents sent for e-signature via DocuSign
- [ ] DocuSign webhook updates envelope status + downloads signed docs
- [ ] Funding checklist tracks all pre-funding requirements
- [ ] "Mark as Funded" updates loan status to `funded`
- [ ] Wire instructions stored encrypted
