#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

echo "Applying demo seed scripts/sql/seed_demo_m1_m9.sql"
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "scripts/sql/seed_demo_m1_m9.sql"
