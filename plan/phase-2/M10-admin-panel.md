# M10 — Admin Panel
> Phase 2 · Organization settings, user management, loan product configuration, branch setup.

## Prerequisites
- M1 complete — admin role enforced
- All core DB tables created

---

## Goal
Build the admin control center: manage users/roles, configure loan products, set up branches, customize pipeline stages, and manage email templates.

---

## Routes to Build

```
app/(admin)/
├── layout.tsx                    # Admin sidebar nav
├── dashboard/
│   └── page.tsx                  # Org overview stats
├── users/
│   ├── page.tsx                  # User list + invite
│   └── [userId]/
│       └── page.tsx              # User detail + role change
├── branches/
│   ├── page.tsx                  # Branch list
│   └── [branchId]/
│       └── page.tsx              # Branch detail + members
├── pipeline/
│   └── page.tsx                  # Customize pipeline stages
├── products/
│   ├── page.tsx                  # Loan product list
│   └── [productId]/
│       └── page.tsx              # Product config + rate sheet
├── templates/
│   └── page.tsx                  # Email template editor
└── settings/
    └── page.tsx                  # Org settings (branding, plan)
```

---

## 1. User Management

### User list
```tsx
// TanStack Table — columns: name, email, role, branch, status, last active
// Actions: Edit role | Deactivate | Resend invite
// Filter by role, branch, status
```

### Staff invite flow
```ts
// Server action: inviteStaff(email, role, branchId)
// 1. Create auth user with temp password via Supabase Admin API
// 2. INSERT into profiles with specified role
// 3. INSERT into branch_members if branchId provided
// 4. Send invite email via Resend with login link
// 5. INSERT audit_log
```

### Role change
```ts
// Server action: changeUserRole(profileId, newRole)
// Validate: cannot demote the last admin
// UPDATE profiles.role
// INSERT audit_log
```

---

## 2. Pipeline Stage Configuration

```tsx
// app/(admin)/pipeline/page.tsx
// Drag-to-reorder list of stages (dnd-kit)
// Edit stage: name, color picker, SLA days, is_terminal toggle
// Add stage button
// Cannot delete stages that have active loans
```

```ts
// Server action: reorderStages(stageIds: string[])
// UPDATE pipeline_stages SET order_index = index WHERE id = stageId
```

---

## 3. Org Settings

```tsx
// app/(admin)/settings/page.tsx
// Organization name, logo upload (Supabase Storage)
// Brand colors (primary/secondary) — preview applied live
// NMLS ID
// Default loan officer assignment (round-robin vs manual)
// Feature flags toggle (from organizations.settings jsonb):
//   - ai_prequalification: boolean
//   - sms_notifications: boolean
//   - secondary_market: boolean
```

---

## 4. Email Template Editor

```tsx
// app/(admin)/templates/page.tsx
// List of trigger events with active/inactive toggle
// Click event → rich text editor (or code editor for HTML)
// Variable reference panel: {{borrower_name}}, {{loan_number}}, etc.
// Preview rendered email button
// Save → UPDATE email_templates
```

---

## Acceptance Criteria
- [ ] Admin can invite staff with role assignment
- [ ] Admin can change user roles (cannot demote last admin)
- [ ] Admin can deactivate users (sets is_active = false)
- [ ] Pipeline stages can be reordered and customized
- [ ] Org logo and brand colors saveable
- [ ] Feature flags toggle and persist in organizations.settings
- [ ] Email templates editable with variable support
- [ ] All admin actions written to audit_log
