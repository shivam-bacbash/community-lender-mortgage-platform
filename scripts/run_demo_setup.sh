#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

"$(dirname "$0")/run_remote_migrations.sh"
"$(dirname "$0")/run_demo_seed.sh"
