-- ============================================================
-- property/001_properties.sql
-- Property, appraisal, and flood certification tables.
-- ============================================================

-- ------------------------------------------------------------
-- properties
-- ------------------------------------------------------------
create table properties (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,

  -- Address
  address               jsonb not null default '{}'::jsonb,
  -- { street, unit, city, state, zip, county, msa_code }

  -- Property details
  property_type         text not null
                        check (property_type in (
                          'sfr', 'condo', 'townhouse',
                          '2_unit', '3_unit', '4_unit',
                          'manufactured', 'cooperative'
                        )),
  occupancy_type        text not null
                        check (occupancy_type in ('primary', 'secondary', 'investment')),
  year_built            integer,
  square_footage        integer,
  lot_size_sqft         integer,
  bedrooms              integer,
  bathrooms             numeric(3,1),

  -- Valuation
  purchase_price        numeric(15,2),
  estimated_value       numeric(15,2),
  appraised_value       numeric(15,2),

  -- Flood
  flood_zone            text,                       -- FEMA flood zone code
  flood_cert_id         uuid,                       -- FK added after flood_certifications created

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_properties_loan on properties(loan_application_id);

select attach_audit_triggers('properties');

alter table properties enable row level security;

create policy "properties_borrower" on properties
  for all using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
  );

create policy "properties_staff" on properties
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- flood_certifications
-- ------------------------------------------------------------
create table flood_certifications (
  id                    uuid primary key default uuid_generate_v4(),
  property_id           uuid not null references properties(id) on delete cascade,

  flood_zone_code       text,                       -- e.g. "X", "AE", "VE"
  flood_zone_desc       text,
  requires_insurance    boolean not null default false,
  cert_number           text,
  life_of_loan          boolean not null default true,
  determined_at         timestamptz,
  provider              text,                       -- e.g. ServiceLink, CoreLogic

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_flood_certs_property on flood_certifications(property_id);

select attach_audit_triggers('flood_certifications');

-- Add FK from properties back to flood_certifications now that table exists
alter table properties
  add constraint fk_properties_flood_cert
  foreign key (flood_cert_id) references flood_certifications(id);

alter table flood_certifications enable row level security;

create policy "flood_certs_staff" on flood_certifications
  for all using (
    property_id in (
      select pr.id from properties pr
      join loan_applications la on la.id = pr.loan_application_id
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- appraisals
-- ------------------------------------------------------------
create table appraisals (
  id                    uuid primary key default uuid_generate_v4(),
  property_id           uuid not null references properties(id) on delete cascade,
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,

  -- AMC / Appraiser
  amc_name              text,
  amc_order_number      text,
  appraiser_name        text,
  appraiser_license     text,

  -- Timeline
  ordered_at            timestamptz,
  inspection_date       date,
  received_at           timestamptz,
  reviewed_at           timestamptz,

  -- Result
  appraised_value       numeric(15,2),
  condition_rating      text,                       -- C1–C6 FNMA scale
  status                text not null default 'pending'
                        check (status in (
                          'pending', 'ordered', 'scheduled',
                          'completed', 'received', 'reviewed',
                          'disputed', 'cancelled'
                        )),
  review_notes          text,
  report_document_id    uuid,                       -- FK to documents added after documents table

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_appraisals_property on appraisals(property_id);
create index idx_appraisals_loan     on appraisals(loan_application_id);

select attach_audit_triggers('appraisals');

alter publication supabase_realtime add table appraisals;

alter table appraisals enable row level security;

create policy "appraisals_staff" on appraisals
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );
