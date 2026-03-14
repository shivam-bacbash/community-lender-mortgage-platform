create index if not exists idx_rate_sheets_active_effective
  on rate_sheets(loan_product_id, effective_date desc)
  where is_active = true
    and deleted_at is null;

create index if not exists idx_rate_locks_active_expiry
  on rate_locks(expires_at)
  where status = 'active'
    and deleted_at is null;
