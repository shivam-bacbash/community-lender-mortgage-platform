# M3 — Loan Officer Dashboard
> Phase 1 · The primary staff interface. LO manages their pipeline, reviews applications, and takes decisions.

## Prerequisites
- M1 (Auth & Roles) complete — authenticated `loan_officer` session
- M2 (Borrower Portal) complete — loans exist to manage
- DB tables: `loan_applications`, `pipeline_stages`, `borrower_profiles`, `employment_records`, `assets`, `liabilities`, `properties`, `documents`, `document_requests`, `tasks`, `underwriting_decisions`, `conditions`

---

## Goal
Build the loan officer's full working environment: a live kanban pipeline, detailed loan review view, underwriting decision flow, task management, and document review.

---

## Routes to Build

```
app/(staff)/
├── layout.tsx                        # Staff nav + sidebar
├── dashboard/
│   └── page.tsx                      # Summary stats + recent activity
├── pipeline/
│   └── page.tsx                      # Kanban board (main working view)
└── loans/
    └── [id]/
        ├── page.tsx                  # Loan overview (default tab)
        ├── borrower/
        │   └── page.tsx              # Full borrower profile + financials
        ├── documents/
        │   └── page.tsx              # Document review + request
        ├── underwriting/
        │   └── page.tsx              # UW decision + AI summary
        ├── conditions/
        │   └── page.tsx              # Condition management
        ├── tasks/
        │   └── page.tsx              # Task list
        └── messages/
            └── page.tsx              # Message thread
```

---

## 1. Staff Dashboard (`/dashboard`)

### Metric cards (top row)
Fetch with a single Supabase RPC or parallel queries:

| Metric | Query |
|---|---|
| Active loans | `count where status not in ('funded','denied','withdrawn')` |
| Submitted today | `count where status='submitted' and submitted_at > today` |
| Awaiting UW decision | `count where status='underwriting'` |
| Closing this week | `count where estimated_closing between today and today+7` |

### Recent activity feed
```ts
// Last 20 audit_log entries for this org
const { data } = await supabase
  .from('audit_logs')
  .select('action, resource_type, resource_id, actor_id, created_at, profiles(first_name, last_name)')
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .limit(20)
```

### My tasks widget
- Open tasks assigned to current LO, ordered by due_date
- Click → navigates to loan task page

---

## 2. Pipeline Kanban Board (`/pipeline`)

This is the highest-value screen. Implement carefully.

### Data fetch
```ts
// Fetch all active loans with their stage
const { data: loans } = await supabase
  .from('loan_applications')
  .select(`
    id, loan_number, status, loan_amount, loan_purpose, loan_type,
    submitted_at, estimated_closing, updated_at,
    pipeline_stage_id,
    pipeline_stages(id, name, color, order_index),
    borrower:profiles!borrower_id(first_name, last_name),
    loan_officer:profiles!loan_officer_id(first_name, last_name),
    ai_analyses(result, analysis_type)
  `)
  .eq('organization_id', orgId)
  .is('deleted_at', null)
  .not('status', 'in', '("funded","denied","withdrawn","cancelled")')
  .order('updated_at', { ascending: false })
```

### Kanban implementation
Use `@dnd-kit/core` with `useDraggable` and `useDroppable`.

```tsx
// components/pipeline/KanbanBoard.tsx
// components/pipeline/KanbanColumn.tsx
// components/pipeline/LoanCard.tsx
```

**KanbanColumn** — one per `pipeline_stage`, sorted by `order_index`

**LoanCard** shows:
- Loan number + borrower name
- Loan amount (formatted as currency)
- Loan type badge (conventional/FHA/VA)
- Days in current stage (calculated from `updated_at`)
- AI risk score badge if available (green/amber/red)
- SLA warning if `days_in_stage > stage.sla_days`

**Drag to move stage:**
```ts
// Server action: moveLoanStage(loanId, newStageId)
async function moveLoanStage(loanId: string, newStageId: string) {
  await supabase.from('loan_applications').update({
    pipeline_stage_id: newStageId,
    updated_at: new Date().toISOString()
  }).eq('id', loanId)

  // Insert audit log
  await supabase.from('audit_logs').insert({
    organization_id: orgId,
    actor_id: userId,
    action: 'loan.stage_changed',
    resource_type: 'loan_application',
    resource_id: loanId,
    after_state: { pipeline_stage_id: newStageId }
  })
}
```

**Optimistic update** — update Zustand `usePipelineStore` immediately on drag, revert on server error.

```ts
// stores/usePipelineStore.ts
interface PipelineStore {
  loans: LoanApplication[]
  setLoans: (loans: LoanApplication[]) => void
  moveLoan: (loanId: string, newStageId: string) => void  // optimistic
  revertMove: (loanId: string, previousStageId: string) => void
}
```

### Realtime sync
```ts
// Subscribe to loan_applications changes for org
// On any UPDATE: invalidate TanStack Query + update Zustand store
supabase
  .channel('pipeline')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'loan_applications',
    filter: `organization_id=eq.${orgId}`
  }, (payload) => {
    store.moveLoan(payload.new.id, payload.new.pipeline_stage_id)
  })
  .subscribe()
```

### Filters toolbar
- Filter by: loan officer, loan type, loan purpose, SLA status
- Search by: borrower name, loan number
- All filters are client-side (data already fetched)

---

## 3. Loan Detail View (`/loans/[id]`)

### Tabbed layout
Tabs: Overview · Borrower · Documents · Underwriting · Conditions · Tasks · Messages

Each tab is a separate route segment (nested layout with tab nav component).

### Overview tab
```ts
// Fetch comprehensive loan data
const { data: loan } = await supabase
  .from('loan_applications')
  .select(`
    *,
    pipeline_stages(*),
    borrower:profiles!borrower_id(*),
    loan_officer:profiles!loan_officer_id(*),
    properties(*),
    ai_analyses(result, analysis_type, created_at, confidence_score),
    underwriting_decisions(decision, decided_at, dti_ratio, ltv_ratio, ai_summary),
    _count: conditions(count), tasks(count), documents(count)
  `)
  .eq('id', loanId)
  .single()
```

**Overview sections:**
- Loan summary card (amount, type, purpose, status)
- Property summary (address, type, value, LTV)
- Key ratios: LTV, DTI, credit score (from latest credit report)
- AI analysis card (pre-qual score + recommendation)
- Stage history timeline
- Quick action buttons: Approve / Deny / Request Docs / Move Stage

### Borrower tab
Full read-only view of:
- Personal info from `borrower_profiles`
- Employment history from `employment_records` (all records, sorted by start_date)
- Income summary (base + overtime + bonus + commission per employer)
- Asset summary (grouped by type, total)
- Liability summary (total monthly payments, DTI contribution)
- Declarations

### Documents tab
```ts
const { data: docs } = await supabase
  .from('documents')
  .select('*, uploaded_by:profiles(first_name, last_name)')
  .eq('loan_application_id', loanId)
  .eq('is_latest', true)
  .is('deleted_at', null)
  .order('document_type')
```

**Document list** — grouped by category (Borrower / Property / Closing)
- Each row: icon, document type, filename, uploaded by, date, status badge
- Click → opens signed URL in new tab (1hr expiry)
- Actions: Accept / Reject (with rejection reason modal) / Request new version

**Document request form:**
```ts
// Server action: requestDocument(loanId, documentType, message, dueDate)
// INSERT into document_requests
// INSERT into notifications (recipient = borrower)
// INSERT into audit_logs
```

### Underwriting tab
- Latest UW decision display (if exists)
- Key ratios at time of decision (DTI, LTV, CLTV, credit score)
- AI underwriting summary card (from `underwriting_decisions.ai_summary`)
- Decision history (all passes)
- **Make Decision** form:

```ts
const uwDecisionSchema = z.object({
  decision: z.enum(['approved', 'approved_with_conditions', 'suspended', 'denied']),
  approved_amount: z.number().optional(),
  notes: z.string().optional(),
  denial_reasons: z.array(z.number()).optional()
})

// Server action: submitUWDecision(loanId, data)
// 1. INSERT into underwriting_decisions
// 2. UPDATE loan_applications.status accordingly
// 3. INSERT into audit_logs
// 4. Send notification to borrower
// 5. If approved → trigger email via Resend
```

### Conditions tab
```ts
const { data: conditions } = await supabase
  .from('conditions')
  .select('*, assigned_to:profiles(first_name, last_name), document:documents(file_name, status)')
  .eq('loan_application_id', loanId)
  .is('deleted_at', null)
  .order('condition_type').order('created_at')
```

- Grouped by type: PTD / PTC / PTFUND / General
- Each condition: description, status chip, assigned to, due date, linked document
- Actions: Mark Satisfied / Waive (with reason) / Assign to team member
- Add condition form (LO/processor only)

### Tasks tab
```ts
// components/tasks/TaskList.tsx
// Grouped by status: Pending → In Progress → Completed
// Each task: title, assignee avatar, due date, priority badge
// Quick complete checkbox
// Add task modal
```

---

## 4. Key Components to Build

```
components/
├── pipeline/
│   ├── KanbanBoard.tsx
│   ├── KanbanColumn.tsx
│   └── LoanCard.tsx
├── loan/
│   ├── LoanSummaryCard.tsx
│   ├── BorrowerFinancialSummary.tsx
│   ├── AIAnalysisCard.tsx
│   ├── UWDecisionForm.tsx
│   ├── ConditionList.tsx
│   └── DocumentReviewRow.tsx
└── shared/
    ├── StatusBadge.tsx
    ├── MetricCard.tsx
    └── ActivityFeed.tsx
```

---

## Server Actions

All in `lib/actions/loans.ts`:
```ts
moveLoanStage(loanId, newStageId)
submitUWDecision(loanId, data)
requestDocument(loanId, documentType, message, dueDate)
reviewDocument(documentId, action: 'accept'|'reject', rejectionReason?)
addCondition(loanId, data)
resolveCondition(conditionId, action: 'satisfy'|'waive', reason?)
createTask(loanId, data)
completeTask(taskId)
```

Every action must:
1. Verify caller's `organization_id` matches loan's `organization_id`
2. Verify caller has correct role for that action
3. INSERT into `audit_logs` after mutation
4. Call `revalidatePath()` for affected routes

---

## Acceptance Criteria

- [ ] Kanban board renders all active loans in correct stages
- [ ] Drag-and-drop moves loans between stages with optimistic update
- [ ] Realtime: another user's stage move appears without refresh
- [ ] Loan detail view shows complete borrower financials
- [ ] Documents can be accepted / rejected with reason
- [ ] Document request sends notification to borrower
- [ ] UW decision can be submitted and updates loan status
- [ ] Conditions can be added, assigned, satisfied, and waived
- [ ] Tasks can be created, assigned, and completed
- [ ] All mutations write to `audit_logs`

---

## Feeds Into
- M4 (AI Pre-qualification) — AI summary card shown in overview + UW tab
- M5 (Document Management) — full doc management builds on this
- M6 (Underwriting Engine) — rule-based UW engine enhances decision form
- M8 (Communications) — message thread on loan detail
