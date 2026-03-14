-- ============================================================
-- documents/001_documents.sql
-- Documents, versioning, requests, and loan conditions.
-- ============================================================

-- ------------------------------------------------------------
-- documents
-- Self-referencing for versioning via parent_document_id.
-- ------------------------------------------------------------
create table documents (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  uploaded_by           uuid not null references profiles(id),

  -- Classification
  document_type         text not null
                        check (document_type in (
                          'paystub', 'w2', 'tax_return', 'bank_statement',
                          'photo_id', 'social_security', 'gift_letter',
                          'purchase_contract', 'title_commitment',
                          'appraisal_report', 'flood_cert', 'homeowners_insurance',
                          'loan_estimate', 'closing_disclosure',
                          'deed_of_trust', 'promissory_note',
                          'voe', 'voa', 'credit_auth', 'other'
                        )),
  document_category     text                       -- borrower / property / closing / compliance
                        check (document_category in ('borrower', 'property', 'closing', 'compliance', 'internal')),

  -- File
  file_name             text not null,
  storage_path          text not null,             -- Supabase Storage object path
  file_size_bytes       integer,
  mime_type             text,
  checksum              text,                      -- SHA-256 for integrity

  -- Versioning
  version               integer not null default 1,
  parent_document_id    uuid references documents(id), -- points to v1 for v2+
  is_latest             boolean not null default true,

  -- Review status
  status                text not null default 'pending'
                        check (status in ('pending', 'under_review', 'accepted', 'rejected', 'expired')),
  reviewed_by           uuid references profiles(id),
  reviewed_at           timestamptz,
  rejection_reason      text,

  -- AI extraction results (M5 / M4)
  ai_extracted_data     jsonb default '{}'::jsonb, -- OCR / classification output
  ai_classified_at      timestamptz,

  -- Expiry (e.g. paystubs expire after 120 days)
  expires_at            timestamptz,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_documents_loan      on documents(loan_application_id);
create index idx_documents_org       on documents(organization_id);
create index idx_documents_type      on documents(loan_application_id, document_type);
create index idx_documents_status    on documents(loan_application_id, status);
create index idx_documents_latest    on documents(loan_application_id, is_latest) where is_latest = true;

select attach_audit_triggers('documents');

alter publication supabase_realtime add table documents;

-- Add FK back-reference from appraisals now that documents exists
alter table appraisals
  add constraint fk_appraisals_report_doc
  foreign key (report_document_id) references documents(id);

alter table documents enable row level security;

create policy "documents_borrower" on documents
  for all using (
    uploaded_by = auth.uid()
    or loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
  );

create policy "documents_staff" on documents
  for all using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid()
      and role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- document_requests
-- LO/processor requests specific docs from borrower.
-- ------------------------------------------------------------
create table document_requests (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  requested_by          uuid not null references profiles(id),

  document_type         text not null,
  message               text,                      -- custom note to borrower
  due_date              date,
  status                text not null default 'pending'
                        check (status in ('pending', 'fulfilled', 'waived', 'overdue')),
  fulfilled_by_document_id uuid references documents(id),
  fulfilled_at          timestamptz,
  waived_by             uuid references profiles(id),
  waived_reason         text,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_doc_requests_loan   on document_requests(loan_application_id);
create index idx_doc_requests_status on document_requests(status);

select attach_audit_triggers('document_requests');

alter table document_requests enable row level security;

create policy "doc_requests_borrower" on document_requests
  for select using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
  );

create policy "doc_requests_staff" on document_requests
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- conditions
-- PTD (prior to docs), PTC (prior to closing), PTFUND
-- ------------------------------------------------------------
create table conditions (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,

  condition_type        text not null
                        check (condition_type in ('PTD', 'PTC', 'PTFUND', 'GENERAL')),
  source                text check (source in ('underwriter', 'processor', 'compliance', 'investor')),
  description           text not null,
  assigned_to           uuid references profiles(id),

  status                text not null default 'open'
                        check (status in ('open', 'submitted', 'satisfied', 'waived', 'rejected')),
  due_date              date,
  resolved_at           timestamptz,
  resolved_by           uuid references profiles(id),
  waived_reason         text,

  -- Supporting document
  document_id           uuid references documents(id),

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_conditions_loan     on conditions(loan_application_id);
create index idx_conditions_status   on conditions(loan_application_id, status);
create index idx_conditions_assignee on conditions(assigned_to);

select attach_audit_triggers('conditions');

alter publication supabase_realtime add table conditions;

alter table conditions enable row level security;

create policy "conditions_staff" on conditions
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

create policy "conditions_borrower_select" on conditions
  for select using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
    and condition_type != 'GENERAL'               -- hide internal conditions from borrower
  );
