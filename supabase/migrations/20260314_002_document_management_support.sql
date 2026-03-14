create index if not exists idx_documents_expiry_latest
  on documents(expires_at)
  where is_latest = true
    and status = 'accepted'
    and deleted_at is null
    and expires_at is not null;

create index if not exists idx_document_requests_pending_type
  on document_requests(loan_application_id, document_type, created_at)
  where status = 'pending'
    and deleted_at is null;
