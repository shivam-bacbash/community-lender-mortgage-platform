# M5 — Document Management
> Phase 2 · Full document lifecycle: versioning, AI classification, expiry tracking, request workflows.

## Prerequisites
- M1, M2, M3 complete
- DB tables: `documents`, `document_requests`, `conditions`, `ai_analyses`

---

## Goal
Upgrade the basic document upload from M2 into a full document management system with versioning, AI-powered classification, expiry alerts, and structured request workflows.

---

## Routes to Build

```
app/(staff)/loans/[id]/documents/
├── page.tsx                  # Full document manager (staff view)
└── [docId]/
    └── page.tsx              # Document detail + version history

app/(borrower)/loans/[id]/documents/
└── page.tsx                  # Borrower upload view (simplified)
```

---

## Key Features

### 1. Document Versioning
When a borrower re-uploads a document of the same type:
```ts
// Server action: uploadNewVersion(loanId, documentType, file)
// 1. Find existing latest document of same type
// 2. Set old document is_latest = false
// 3. INSERT new document with version = old.version + 1, parent_document_id = old.id
await supabase.from('documents')
  .update({ is_latest: false })
  .eq('loan_application_id', loanId)
  .eq('document_type', documentType)
  .eq('is_latest', true)
```

### 2. AI Document Classification (OCR)
On every upload, trigger async classification:
```ts
// lib/ai/documentExtraction.ts
const systemPrompt = `
You are a mortgage document classifier. Analyze the document description and metadata.
Return ONLY valid JSON:
{
  "detected_type": <document_type string>,
  "confidence": <0.0-1.0>,
  "extracted_fields": {
    "borrower_name": <string|null>,
    "date": <string|null>,
    "employer_name": <string|null>,
    "income_amount": <number|null>,
    "period": <string|null>
  },
  "anomalies": [<string>]
}
`
// Store result in documents.ai_extracted_data
// Store full analysis in ai_analyses table
```

### 3. Expiry Tracking
| Document type | Expiry days |
|---|---|
| paystub | 60 |
| bank_statement | 60 |
| credit_auth | 120 |
| photo_id | 365 |
| purchase_contract | never |

```ts
// Cron job (Supabase Edge Function, daily):
// SELECT * FROM documents WHERE expires_at < now() + interval '7 days'
// AND status = 'accepted' AND is_latest = true
// → INSERT notifications for LO and borrower
```

### 4. Document Checklist
Per loan type, define required document checklist:
```ts
const REQUIRED_DOCS: Record<string, string[]> = {
  conventional: ['paystub', 'w2', 'bank_statement', 'photo_id', 'purchase_contract'],
  fha: ['paystub', 'w2', 'bank_statement', 'photo_id', 'purchase_contract', 'social_security'],
  va: ['paystub', 'w2', 'bank_statement', 'photo_id', 'purchase_contract'],
}
// Compare against submitted documents to show completion %
```

---

## Components

```
components/documents/
├── DocumentChecklist.tsx       # Required docs with completion status
├── DocumentGrid.tsx            # Grid view grouped by category
├── DocumentRow.tsx             # Single document row with actions
├── VersionHistory.tsx          # Timeline of document versions
├── UploadZone.tsx              # Drag-drop upload area
├── DocumentViewer.tsx          # Iframe/embed for PDF preview
└── ExpiryAlert.tsx             # Banner for expiring documents
```

---

## Acceptance Criteria
- [ ] Re-uploading same document type creates new version, old marked not latest
- [ ] AI classification runs on upload and populates `ai_extracted_data`
- [ ] Document checklist shows completion % per loan
- [ ] Expiring documents (< 7 days) show alerts
- [ ] Staff can accept/reject with reason, borrower notified
- [ ] Version history shows all versions with diff dates
