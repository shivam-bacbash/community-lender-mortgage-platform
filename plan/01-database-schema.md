# 01-database-schema.md
> Agent context file — read this before writing any SQL, Supabase queries, or server actions.

---

## Stack
- **Database**: Supabase (PostgreSQL 15)
- **Auth**: Supabase Auth (`auth.users`)
- **Storage**: Supabase Storage (documents bucket)
- **Realtime**: Supabase Realtime (selected tables)

---

## Conventions applied to ALL 31 tables

| Convention | Implementation |
|---|---|
| Primary keys | `uuid` via `uuid_generate_v4()` |
| Multi-tenancy | Every root entity has `organization_id uuid FK → organizations` |
| Soft deletes | `deleted_at timestamptz` — never hard delete |
| Timestamps | `created_at`, `updated_at` — set by DB trigger |
| Audit actors | `created_by`, `updated_by` — `uuid FK → auth.users`, set by DB trigger from `auth.uid()` |
| RLS | Enabled on every table. Always filter by `organization_id` + `role` |
| Realtime | Enabled on key tables (see below) |

### Shared trigger function
All triggers are attached via `select attach_audit_triggers('table_name')`.
Defined in `000_shared_functions.sql` — **run this first**.

---

## Migration execution order

Run files in this exact order to satisfy FK dependencies:

```
000_shared_functions.sql            ← MUST BE FIRST

core/001_organizations.sql
core/002_profiles.sql
core/003_branches.sql

loan/001_pipeline_stages.sql
loan/002_loan_applications.sql      ← loan_number auto-generated: LN-2026-00001
loan/003_borrower_details.sql       ← borrower_profiles, employment, assets, liabilities

property/001_properties.sql         ← properties, flood_certifications, appraisals
                                       (circular FK resolved with ALTER TABLE after)

documents/001_documents.sql         ← documents, document_requests, conditions
                                       (appraisals.report_document_id FK added here)

underwriting/001_underwriting.sql   ← underwriting_rules, credit_reports, underwriting_decisions

pricing/001_pricing.sql             ← loan_products, rate_sheets, loan_fees, rate_locks

comms/001_communications.sql        ← tasks, messages, notifications, email_templates

compliance/001_compliance.sql       ← audit_logs (append-only), disclosures, hmda_records

closing/001_closing.sql             ← closing_orders, esign_envelopes, secondary_market_loans

ai/001_ai.sql                       ← ai_analyses, fraud_flags, analytics_events
```

---

## Table index (31 tables)

### Core — Tenancy, Users & Roles
| Table | Purpose | Phase |
|---|---|---|
| `organizations` | Root tenant. All data scoped here | 1 |
| `profiles` | Extends `auth.users`. Roles: borrower / loan_officer / processor / underwriter / admin | 1 |
| `branches` | Physical/virtual branches within an org | 2 |
| `branch_members` | Many-to-many: profiles ↔ branches | 2 |

### Loan — Applications & Borrowers
| Table | Purpose | Phase |
|---|---|---|
| `pipeline_stages` | Kanban columns, configurable per org | 1 |
| `loan_applications` | Central table. Everything FK's here | 1 |
| `borrower_profiles` | PII, addresses, declarations (URLA) | 1 |
| `employment_records` | Employment history + income breakdown | 1 |
| `assets` | Bank accounts, retirement, gifts | 1 |
| `liabilities` | Debts used for DTI calculation | 1 |

### Property
| Table | Purpose | Phase |
|---|---|---|
| `properties` | Subject property details | 1 |
| `flood_certifications` | FEMA flood zone determination | 2 |
| `appraisals` | AMC orders, appraised value, status | 2 |

### Documents
| Table | Purpose | Phase |
|---|---|---|
| `documents` | All uploaded files. Self-refs for versioning | 1 |
| `document_requests` | LO requests specific docs from borrower | 1 |
| `conditions` | PTD / PTC / PTFUND conditions | 2 |

### Underwriting
| Table | Purpose | Phase |
|---|---|---|
| `underwriting_rules` | Configurable thresholds (DTI, LTV, FICO) per loan type | 2 |
| `credit_reports` | Bureau pulls, scores, tradelines | 2 |
| `underwriting_decisions` | UW decision record + AI summary | 1 |

### Pricing
| Table | Purpose | Phase |
|---|---|---|
| `loan_products` | Loan program catalog | 2 |
| `rate_sheets` | Daily rate matrix (LTV × FICO) | 2 |
| `loan_fees` | Itemized fees (LE/CD line items) | 2 |
| `rate_locks` | Locked rate + expiry tracking | 2 |

### Communications
| Table | Purpose | Phase |
|---|---|---|
| `tasks` | Action items per loan | 1 |
| `messages` | In-app thread (supports internal LO notes) | 1 |
| `notifications` | System alerts → UI bell + email/SMS | 1 |
| `email_templates` | Per-org transactional email templates | 2 |

### Compliance
| Table | Purpose | Phase |
|---|---|---|
| `audit_logs` | **Append-only** tamper-proof activity log | 1 |
| `disclosures` | TRID LE/CD tracking with deadlines | 2 |
| `hmda_records` | Annual HMDA LAR data per loan | 3 |

### Closing
| Table | Purpose | Phase |
|---|---|---|
| `closing_orders` | Title company, closing date, funding | 3 |
| `esign_envelopes` | DocuSign/HelloSign envelope tracking | 3 |
| `secondary_market_loans` | GSE delivery (FNMA/FHLMC) | 4 |

### AI
| Table | Purpose | Phase |
|---|---|---|
| `ai_analyses` | **Append-only** — every Claude API call stored | 1 |
| `fraud_flags` | Anomaly flags with review workflow | 4 |
| `analytics_events` | **Append-only** behavioural event stream | 2 |

---

## Supabase Realtime tables

These tables have `alter publication supabase_realtime add table X` applied:

| Table | Why |
|---|---|
| `loan_applications` | Pipeline kanban live updates |
| `documents` | Document upload/review status |
| `underwriting_decisions` | Decision notification to LO |
| `conditions` | Condition status live updates |
| `tasks` | Task assignment / completion |
| `messages` | Live in-app chat |

---

## Special tables — append-only (no UPDATE / no DELETE)

| Table | Reason |
|---|---|
| `audit_logs` | Tamper-proof compliance record |
| `ai_analyses` | Fair lending audit trail |
| `analytics_events` | Event stream integrity |

RLS on these tables includes restrictive `UPDATE` and `DELETE` policies that always return `false`.

---

## Encryption

| Field | Method |
|---|---|
| `borrower_profiles.ssn_encrypted` | `pgp_sym_encrypt(value, app_secret_key)` via pgcrypto |
| `closing_orders.wire_instructions` | Encrypt at application layer before INSERT |
| `credit_reports.report_data` | Encrypted at application layer |

---

## Key relationships (for query building)

```
organizations
  └── profiles (role: borrower / loan_officer / processor / underwriter / admin)
  └── branches → branch_members → profiles
  └── pipeline_stages
  └── loan_products → rate_sheets
  └── underwriting_rules
  └── email_templates

loan_applications
  ├── borrower_id → profiles
  ├── loan_officer_id → profiles
  ├── pipeline_stage_id → pipeline_stages
  ├── borrower_profiles
  │     ├── employment_records
  │     ├── assets
  │     └── liabilities
  ├── properties
  │     ├── flood_certifications
  │     └── appraisals
  ├── documents → document_requests / conditions
  ├── credit_reports
  ├── underwriting_decisions
  ├── loan_fees / rate_locks
  ├── tasks / messages / notifications
  ├── disclosures
  ├── closing_orders → esign_envelopes
  ├── ai_analyses → fraud_flags
  └── analytics_events
```

---

## RLS role matrix

| Role | Own loans | All org loans | Org settings | Audit logs |
|---|---|---|---|---|
| `borrower` | ✓ read/write | ✗ | ✗ | ✗ |
| `loan_officer` | ✓ full | ✓ read | ✗ | ✗ |
| `processor` | — | ✓ read/write | ✗ | ✗ |
| `underwriter` | — | ✓ read + decisions | ✗ | ✓ read |
| `admin` | — | ✓ full | ✓ full | ✓ full |

---

*Generated for: SimpleNexus Community Lender Platform*
*Tech stack: Next.js 14 · Supabase · Untitled UI · Tailwind CSS*
*Primary keys: UUID · Multi-tenant: shared DB, organization_id scoped · RLS: enabled on all tables*
