-- ============================================================
-- comms/001_communications.sql
-- Tasks, in-app messages, notifications, email templates.
-- ============================================================

-- ------------------------------------------------------------
-- tasks
-- ------------------------------------------------------------
create table tasks (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  assigned_to           uuid references profiles(id),
  assigned_by           uuid references profiles(id),

  title                 text not null,
  description           text,
  due_date              date,
  priority              text not null default 'medium'
                        check (priority in ('low', 'medium', 'high', 'urgent')),
  status                text not null default 'pending'
                        check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  task_type             text check (task_type in (
                          'doc_collection', 'verification', 'review',
                          'disclosure', 'condition', 'general'
                        )),

  completed_at          timestamptz,
  completed_by          uuid references profiles(id),

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_tasks_loan       on tasks(loan_application_id);
create index idx_tasks_assignee   on tasks(assigned_to, status);
create index idx_tasks_due        on tasks(due_date) where status not in ('completed', 'cancelled');

select attach_audit_triggers('tasks');

alter publication supabase_realtime add table tasks;

alter table tasks enable row level security;

create policy "tasks_borrower_select" on tasks
  for select using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
    and task_type = 'doc_collection'               -- borrowers only see their action items
  );

create policy "tasks_staff" on tasks
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- messages
-- In-app messaging thread per loan. is_internal = LO-only notes.
-- ------------------------------------------------------------
create table messages (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  sender_id             uuid not null references profiles(id),

  body                  text not null,
  channel               text not null default 'in_app'
                        check (channel in ('in_app', 'email', 'sms')),
  is_internal           boolean not null default false, -- true = LO team notes, hidden from borrower

  read_at               timestamptz,
  attachment_ids        uuid[] default '{}',        -- references to documents.id

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_messages_loan    on messages(loan_application_id, created_at);
create index idx_messages_sender  on messages(sender_id);

select attach_audit_triggers('messages');

alter publication supabase_realtime add table messages;

alter table messages enable row level security;

-- Borrowers see non-internal messages on their loans
create policy "messages_borrower" on messages
  for select using (
    is_internal = false
    and loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
  );

-- Borrowers can send messages on their own loans
create policy "messages_borrower_insert" on messages
  for insert with check (
    sender_id = auth.uid()
    and is_internal = false
    and loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
  );

-- Staff see all messages (including internal)
create policy "messages_staff" on messages
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- notifications
-- System-generated alerts. Consumed by UI bell + email/SMS.
-- ------------------------------------------------------------
create table notifications (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  recipient_id          uuid not null references profiles(id) on delete cascade,

  type                  text not null,
  -- e.g. status_change / doc_requested / doc_uploaded /
  --      condition_added / task_assigned / message_received /
  --      rate_lock_expiring / disclosure_due

  title                 text not null,
  body                  text,
  action_url            text,                       -- deep link in the app

  -- Related resource (polymorphic)
  resource_type         text check (resource_type in ('loan', 'task', 'document', 'message', 'condition')),
  resource_id           uuid,

  read_at               timestamptz,
  sent_via              text[] default '{}',        -- ['email', 'sms', 'push']

  -- Audit columns (no updated_by — notifications are immutable once sent)
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_notifications_recipient on notifications(recipient_id, read_at);
create index idx_notifications_unread    on notifications(recipient_id) where read_at is null;

select attach_audit_triggers('notifications');

alter table notifications enable row level security;

create policy "notifications_own" on notifications
  for all using (recipient_id = auth.uid());

-- ------------------------------------------------------------
-- email_templates
-- Per-org customizable transactional email templates.
-- ------------------------------------------------------------
create table email_templates (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,

  trigger_event         text not null,
  -- e.g. application_submitted / status_changed / doc_requested /
  --      approved / denied / clear_to_close / rate_lock_expiring

  subject               text not null,
  body_html             text not null,
  body_text             text,                       -- plain text fallback
  reply_to              text,

  -- Merge variable definitions for documentation
  variables             jsonb default '[]'::jsonb,
  -- e.g. [{"key": "borrower_name"}, {"key": "loan_number"}]

  is_active             boolean not null default true,
  is_default            boolean not null default false, -- org override of system default

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz,

  unique(organization_id, trigger_event)
);

create index idx_email_templates_org on email_templates(organization_id, is_active);

select attach_audit_triggers('email_templates');

alter table email_templates enable row level security;

create policy "email_templates_read" on email_templates
  for select using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "email_templates_manage" on email_templates
  for all using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
