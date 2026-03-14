#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

MIGRATIONS=(
  "supabase/migrations/000_shared_functions.sql"
  "supabase/migrations/core/001_organizations.sql"
  "supabase/migrations/core/002_profiles.sql"
  "supabase/migrations/core/003_branches.sql"
  "supabase/migrations/core/004_auth_profile_trigger.sql"
  "supabase/migrations/core/005_fix_profiles_rls_recursion.sql"
  "supabase/migrations/loan/001_pipeline_stages.sql"
  "supabase/migrations/loan/002_loan_applications.sql"
  "supabase/migrations/loan/003_borrower_details.sql"
  "supabase/migrations/property/001_properties.sql"
  "supabase/migrations/documents/001_documents.sql"
  "supabase/migrations/underwriting/001_underwriting.sql"
  "supabase/migrations/pricing/001_pricing.sql"
  "supabase/migrations/comms/001_communications.sql"
  "supabase/migrations/compliance/001_compliance.sql"
  "supabase/migrations/closing/001_closing.sql"
  "supabase/migrations/ai/001_ai.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  echo "Applying ${migration}"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${migration}"
done
