-- ============================================================
-- closing/001_closing.sql
-- Closing coordination, e-sign, secondary market delivery.
-- ============================================================

-- ------------------------------------------------------------
-- closing_orders
-- ------------------------------------------------------------
create table closing_orders (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  ordered_by            uuid references profiles(id),

  -- Title company
  title_company_name    text,
  title_company_phone   text,
  settlement_agent      text,
  settlement_agent_email text,

  -- Closing details
  closing_date          timestamptz,
  closing_location      jsonb default '{}'::jsonb,
  -- { type: 'in_person'|'remote'|'hybrid', address: {...}, video_link: "..." }

  status                text not null default 'pending'
                        check (status in (
                          'pending', 'scheduled', 'docs_out',
                          'signed', 'funded', 'completed', 'cancelled'
                        )),

  -- Wire instructions (encrypted at app layer before storing)
  wire_instructions     jsonb default '{}'::jsonb,

  -- Key timestamps
  docs_sent_at          timestamptz,
  signed_at             timestamptz,
  funded_at             timestamptz,
  disbursed_at          timestamptz,
  funding_amount        numeric(15,2),

  notes                 text,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_closing_orders_loan   on closing_orders(loan_application_id);
create index idx_closing_orders_status on closing_orders(status, closing_date);

select attach_audit_triggers('closing_orders');

alter table closing_orders enable row level security;

create policy "closing_orders_borrower" on closing_orders
  for select using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
  );

create policy "closing_orders_staff" on closing_orders
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'admin')
    )
  );

-- ------------------------------------------------------------
-- esign_envelopes
-- Tracks DocuSign / HelloSign envelope per signing event.
-- ------------------------------------------------------------
create table esign_envelopes (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  created_by_profile    uuid references profiles(id),

  provider              text not null check (provider in ('docusign', 'hellosign', 'other')),
  envelope_id           text not null,             -- external provider reference

  signing_event         text,
  -- e.g. initial_disclosures / loan_estimate / closing_docs

  status                text not null default 'created'
                        check (status in ('created', 'sent', 'delivered', 'signed', 'completed', 'declined', 'voided')),

  sent_at               timestamptz,
  viewed_at             timestamptz,
  completed_at          timestamptz,
  voided_at             timestamptz,
  void_reason           text,

  -- Signed documents
  document_ids          uuid[] default '{}',       -- references to documents.id

  -- Webhook payload cache (last received)
  webhook_data          jsonb default '{}'::jsonb,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_esign_loan     on esign_envelopes(loan_application_id);
create index idx_esign_envelope on esign_envelopes(envelope_id);

select attach_audit_triggers('esign_envelopes');

alter table esign_envelopes enable row level security;

create policy "esign_borrower" on esign_envelopes
  for select using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
  );

create policy "esign_staff" on esign_envelopes
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'admin')
    )
  );

-- ------------------------------------------------------------
-- secondary_market_loans
-- Tracks GSE delivery (FNMA/FHLMC) and investor commitments.
-- ------------------------------------------------------------
create table secondary_market_loans (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  organization_id       uuid not null references organizations(id),
  handled_by            uuid references profiles(id),

  investor_name         text not null,
  -- e.g. 'FNMA', 'FHLMC', 'GNMA', 'portfolio', 'correspondent'

  commitment_number     text,
  trade_date            date,
  delivery_date         date,
  settlement_date       date,

  purchase_price        numeric(10,4),             -- as % of par e.g. 101.2500
  servicing_released    boolean not null default true,
  srp                   numeric(6,4),              -- servicing released premium

  -- MISMO 3.4 / ULAD file for GSE delivery
  mismo_file_path       text,                      -- Supabase Storage path
  delivery_method       text check (delivery_method in ('whole_loan', 'mbs', 'cash')),

  status                text not null default 'pending'
                        check (status in (
                          'pending', 'committed', 'delivered',
                          'purchased', 'rejected', 'cancelled'
                        )),
  rejection_reason      text,
  purchased_at          timestamptz,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_secondary_market_loan on secondary_market_loans(loan_application_id);
create index idx_secondary_market_org  on secondary_market_loans(organization_id, status);

select attach_audit_triggers('secondary_market_loans');

alter table secondary_market_loans enable row level security;

create policy "secondary_market_admin" on secondary_market_loans
  for all using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid()
      and role in ('admin')
    )
  );
