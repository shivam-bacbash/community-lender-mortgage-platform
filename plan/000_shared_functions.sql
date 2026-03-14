-- ============================================================
-- 000_shared_functions.sql
-- Shared DB trigger functions applied to all 31 tables
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Function: auto-set created_at, updated_at on INSERT
-- ------------------------------------------------------------
create or replace function set_created_timestamps()
returns trigger as $$
begin
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- Function: auto-set updated_at on UPDATE
-- ------------------------------------------------------------
create or replace function set_updated_timestamp()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- Function: auto-set created_by, updated_by from auth.uid()
-- ------------------------------------------------------------
create or replace function set_created_by()
returns trigger as $$
begin
  new.created_by := auth.uid();
  new.updated_by := auth.uid();
  return new;
end;
$$ language plpgsql;

create or replace function set_updated_by()
returns trigger as $$
begin
  new.updated_by := auth.uid();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- Helper macro: attach all 4 audit triggers to a table
-- Usage: select attach_audit_triggers('table_name');
-- ------------------------------------------------------------
create or replace function attach_audit_triggers(tbl text)
returns void as $$
begin
  execute format('
    create trigger trg_%s_created_ts
      before insert on %I
      for each row execute function set_created_timestamps();

    create trigger trg_%s_updated_ts
      before update on %I
      for each row execute function set_updated_timestamp();

    create trigger trg_%s_created_by
      before insert on %I
      for each row execute function set_created_by();

    create trigger trg_%s_updated_by
      before update on %I
      for each row execute function set_updated_by();
  ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
end;
$$ language plpgsql;
