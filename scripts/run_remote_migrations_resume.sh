#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

psql_exec() {
  local sql="$1"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "${sql}"
}

apply_file() {
  local file="$1"
  echo "Applying ${file}"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${file}"
}

relation_exists() {
  local relation="$1"
  psql "${DATABASE_URL}" -tAc "select to_regclass('public.${relation}') is not null"
}

apply_file_if_missing() {
  local relation="$1"
  local file="$2"

  if [[ "$(relation_exists "${relation}")" == "t" ]]; then
    echo "Skipping ${file}; ${relation} already exists"
    return
  fi

  apply_file "${file}"
}

apply_file_if_missing "profiles" "supabase/migrations/core/002_profiles.sql"

echo "Applying deferred organizations policies"
psql_exec "do \$\$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organizations' and policyname = 'org_select'
  ) then
    create policy \"org_select\" on organizations
      for select using (
        id in (
          select organization_id from profiles where id = auth.uid()
        )
      );
  end if;
end
\$\$;"

psql_exec "do \$\$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organizations' and policyname = 'org_update'
  ) then
    create policy \"org_update\" on organizations
      for update using (
        id in (
          select organization_id from profiles
          where id = auth.uid() and role = 'admin'
        )
      );
  end if;
end
\$\$;"

apply_file_if_missing "branches" "supabase/migrations/core/003_branches.sql"
apply_file "supabase/migrations/core/004_auth_profile_trigger.sql"
apply_file "supabase/migrations/core/005_fix_profiles_rls_recursion.sql"
apply_file_if_missing "pipeline_stages" "supabase/migrations/loan/001_pipeline_stages.sql"
apply_file_if_missing "loan_applications" "supabase/migrations/loan/002_loan_applications.sql"

if [[ "$(relation_exists "employment_records")" == "t" ]]; then
  echo "Skipping borrower details continuation; employment_records already exists"
elif [[ "$(relation_exists "borrower_profiles")" == "t" ]]; then
  apply_file "scripts/sql/loan_003_borrower_details_resume.sql"
else
  apply_file "supabase/migrations/loan/003_borrower_details.sql"
fi

apply_file_if_missing "properties" "supabase/migrations/property/001_properties.sql"
apply_file_if_missing "documents" "supabase/migrations/documents/001_documents.sql"

if [[ "$(relation_exists "credit_reports")" == "t" ]]; then
  echo "Skipping underwriting continuation; credit_reports already exists"
elif [[ "$(relation_exists "underwriting_rules")" == "t" ]]; then
  apply_file "scripts/sql/underwriting_001_resume.sql"
else
  apply_file "supabase/migrations/underwriting/001_underwriting.sql"
fi

apply_file_if_missing "loan_products" "supabase/migrations/pricing/001_pricing.sql"
apply_file_if_missing "tasks" "supabase/migrations/comms/001_communications.sql"
apply_file_if_missing "audit_logs" "supabase/migrations/compliance/001_compliance.sql"
apply_file_if_missing "closing_orders" "supabase/migrations/closing/001_closing.sql"
apply_file_if_missing "ai_analyses" "supabase/migrations/ai/001_ai.sql"
