# M2 — Borrower Portal
> Phase 1 · Core demo module. The borrower's complete journey from application to status tracking.

## Prerequisites
- M1 (Auth & Roles) complete — authenticated borrower session required
- DB tables: `loan_applications`, `borrower_profiles`, `employment_records`, `assets`, `liabilities`, `properties`, `documents`, `pipeline_stages`

---

## Goal
Build the full borrower-facing experience: multi-step loan application, document upload, and real-time loan status tracker.

---

## Routes to Build

```
app/(borrower)/
├── layout.tsx                    # Borrower nav + sidebar
├── dashboard/
│   └── page.tsx                  # Active loans list + quick actions
├── apply/
│   ├── page.tsx                  # Step router (redirects to step 1)
│   └── [step]/
│       └── page.tsx              # Step 1–6 of application form
└── loans/
    └── [id]/
        ├── page.tsx              # Loan status + timeline
        ├── documents/
        │   └── page.tsx          # Upload + view documents
        └── messages/
            └── page.tsx          # Message thread with LO
```

---

## 1. Borrower Dashboard (`/dashboard`)

### Data to fetch
```ts
// Server Component — fetch on server
const { data: loans } = await supabase
  .from('loan_applications')
  .select(`
    id, loan_number, status, loan_amount, loan_purpose,
    loan_type, created_at, estimated_closing,
    pipeline_stages(name, color)
  `)
  .eq('borrower_id', userId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
```

### UI Components
- **LoanCard** — shows loan number, status badge, loan amount, stage, last updated
- **StatusBadge** — color-coded by status (draft=gray, submitted=blue, approved=green, denied=red)
- **EmptyState** — "Start your first application" CTA when no loans exist
- **QuickActions** — "New Application" button always visible

---

## 2. Multi-Step Loan Application (`/apply/[step]`)

### Step structure
| Step | Route | Data collected | DB table |
|---|---|---|---|
| 1 | `/apply/1` | Loan purpose, type, amount, property address | `loan_applications`, `properties` |
| 2 | `/apply/2` | Personal info, SSN, DOB, marital status | `borrower_profiles` |
| 3 | `/apply/3` | Current address, housing status, years at address | `borrower_profiles` |
| 4 | `/apply/4` | Employment, employer, income breakdown | `employment_records` |
| 5 | `/apply/5` | Assets (bank accounts, retirement) | `assets` |
| 6 | `/apply/6` | Liabilities (debts, monthly payments) | `liabilities` |
| Review | `/apply/review` | Summary of all steps + submit | All |

### State management
```ts
// stores/useApplicationStore.ts
// Persists form data across steps in Zustand
// Clear on successful submission
interface ApplicationStore {
  applicationId: string | null       // created on step 1
  currentStep: number
  stepData: {
    step1: Step1Data | null
    step2: Step2Data | null
    // ...
  }
  setStepData: (step: number, data: unknown) => void
  setApplicationId: (id: string) => void
  reset: () => void
}
```

### Step 1 — Loan Details
```ts
const step1Schema = z.object({
  loan_purpose: z.enum(['purchase', 'refinance', 'cash_out']),
  loan_type: z.enum(['conventional', 'fha', 'va', 'usda', 'jumbo']),
  loan_amount: z.number().min(50000).max(5000000),
  down_payment: z.number().min(0),
  // Property
  property_street: z.string().min(1),
  property_city: z.string().min(1),
  property_state: z.string().length(2),
  property_zip: z.string().length(5),
  property_type: z.enum(['sfr', 'condo', 'townhouse', '2_unit', '3_unit', '4_unit']),
  occupancy_type: z.enum(['primary', 'secondary', 'investment']),
})
```

Server action on Step 1 submit:
```ts
// 1. INSERT into loan_applications (creates loan_number LN-2026-XXXXX)
// 2. INSERT into properties
// 3. Store applicationId in Zustand
// 4. Redirect to /apply/2
```

### Step 2 — Personal Info
```ts
const step2Schema = z.object({
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/), // encrypt before storing
  dob: z.string(),                                // date string
  marital_status: z.enum(['single', 'married', 'separated']),
  citizenship: z.enum(['us_citizen', 'permanent_resident', 'non_permanent_resident']),
  dependents_count: z.number().min(0),
})
// SSN: encrypt client-side or send over HTTPS and encrypt in server action
// Store as pgp_sym_encrypt(ssn, APP_SECRET_KEY)
```

### Step 4 — Employment
- Support adding multiple employers (primary + secondary)
- Calculate total monthly income from all active employment records
- Display computed total prominently

### Step 6 — Liabilities
- Allow marking liabilities as "to be paid off at closing"
- Real-time DTI preview: `(total monthly debts + estimated PITI) / gross monthly income`
- Color-code DTI: green < 36%, yellow 36–43%, red > 43%

### Review Page
- Read-only summary of all steps
- Edit links per section (navigate back to step)
- Submit button → Server Action:
  1. Set `loan_applications.status = 'submitted'`
  2. Set `submitted_at = now()`
  3. Trigger AI pre-qualification (M4)
  4. Send confirmation email via Resend
  5. Redirect to `/loans/[id]`

### Step navigation component
```tsx
// components/forms/StepIndicator.tsx
// Shows: Step 1 of 6 — Loan Details
// Progress bar + step dots
// Clicking completed steps navigates back (not forward)
```

---

## 3. Loan Status Page (`/loans/[id]`)

### Data to fetch
```ts
const { data: loan } = await supabase
  .from('loan_applications')
  .select(`
    *,
    pipeline_stages(name, color, order_index),
    documents(id, document_type, status, created_at),
    conditions(id, description, status, condition_type, due_date),
    tasks(id, title, status, due_date, task_type),
    underwriting_decisions(decision, decided_at),
    ai_analyses(result, analysis_type, created_at)
  `)
  .eq('id', loanId)
  .eq('borrower_id', userId)
  .single()
```

### UI Sections

**Timeline/Progress tracker**
- Visual stepper showing pipeline stages
- Current stage highlighted, completed stages checked
- Estimated closing date if set

**AI Pre-qualification card** (Phase 1 / M4 output)
- Score badge (0–100)
- Recommendation: "Likely to Approve" / "Needs Review" / "High Risk"
- Key strengths (2–3 bullets)
- Key concerns (1–2 bullets)
- Disclaimer: "This is an automated assessment, not a final decision"

**Documents section**
- List of uploaded docs with status badges
- "Upload document" CTA
- Outstanding document requests highlighted in amber

**Action items**
- Open tasks assigned to borrower (e.g. upload missing doc)
- Open conditions visible to borrower (non-internal only)

**Messages**
- Preview of last 2 messages
- Link to full message thread

### Realtime subscription
```ts
// hooks/useLoanRealtime.ts
// Subscribe to loan_applications changes for this loan ID
// Invalidate TanStack Query cache on update
supabase
  .channel(`loan:${loanId}`)
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'loan_applications', filter: `id=eq.${loanId}` },
    () => queryClient.invalidateQueries({ queryKey: ['loan', loanId] })
  )
  .subscribe()
```

---

## 4. Document Upload (`/loans/[id]/documents`)

### Upload flow
1. Borrower selects file (PDF, JPG, PNG — max 25MB)
2. Select document type from dropdown
3. Upload to Supabase Storage: `documents/{organization_id}/{loan_id}/{uuid}-{filename}`
4. INSERT into `documents` table with `storage_path`
5. Trigger AI document extraction (M4 — async, don't block UI)

```ts
// Server action: uploadDocument()
const { data: storageData } = await supabase.storage
  .from('documents')
  .upload(storagePath, file)

await supabase.from('documents').insert({
  organization_id,
  loan_application_id: loanId,
  uploaded_by: userId,
  document_type,
  file_name: file.name,
  storage_path: storageData.path,
  file_size_bytes: file.size,
  mime_type: file.type,
  status: 'pending'
})
```

### Signed URL for viewing
```ts
const { data } = await supabase.storage
  .from('documents')
  .createSignedUrl(storagePath, 3600)  // 1 hour expiry
```

---

## Zod Schemas Summary

All schemas live in `lib/validations/application.ts`:
- `step1Schema`, `step2Schema`, `step3Schema`, `step4Schema`, `step5Schema`, `step6Schema`
- `documentUploadSchema`
- Export combined: `fullApplicationSchema = step1Schema.merge(step2Schema)...`

---

## Acceptance Criteria

- [ ] Borrower can complete all 6 steps and submit application
- [ ] `loan_number` (LN-2026-XXXXX) generated and visible on dashboard
- [ ] Each step saves to correct DB tables
- [ ] DTI preview shown in real-time on step 6
- [ ] Documents can be uploaded and listed
- [ ] Status page shows pipeline stage, AI pre-qual card (after M4)
- [ ] Realtime updates: if LO changes status, borrower sees it without refresh
- [ ] All routes redirect to `/login` if unauthenticated

---

## Feeds Into
- M3 (LO Dashboard) — LO sees submitted applications from this module
- M4 (AI Pre-qualification) — triggered on application submit
- M8 (Communications) — message thread on loan detail page
