# HOW-TO-USE.md
> Instructions for setting up the project and feeding these files to AI agents.

---

## What's in This Package

```
nexuslend-agent-context/
│
├── HOW-TO-USE.md                          ← You are here
│
├── 00-project-overview.md                 ← Feed to EVERY agent first
├── 01-database-schema.md                  ← Feed to EVERY agent second
│
├── migrations/                            ← Run these in Supabase (in order)
│   ├── 000_shared_functions.sql           ← ALWAYS run first
│   ├── core/
│   │   ├── 001_organizations.sql
│   │   ├── 002_profiles.sql
│   │   └── 003_branches.sql
│   ├── loan/
│   │   ├── 001_pipeline_stages.sql
│   │   ├── 002_loan_applications.sql
│   │   └── 003_borrower_details.sql
│   ├── property/
│   │   └── 001_properties.sql
│   ├── documents/
│   │   └── 001_documents.sql
│   ├── underwriting/
│   │   └── 001_underwriting.sql
│   ├── pricing/
│   │   └── 001_pricing.sql
│   ├── comms/
│   │   └── 001_communications.sql
│   ├── compliance/
│   │   └── 001_compliance.sql
│   ├── closing/
│   │   └── 001_closing.sql
│   └── ai/
│       └── 001_ai.sql
│
├── phase-1/                               ← Hackathon MVP (build in this order)
│   ├── M1-auth-roles.md
│   ├── M2-borrower-portal.md
│   ├── M3-loan-officer-dashboard.md
│   └── M4-ai-prequalification.md
│
├── phase-2/                               ← Core product v1
│   ├── M5-document-management.md
│   ├── M6-underwriting-engine.md
│   ├── M7-loan-pricing-calculator.md
│   ├── M8-communications-hub.md
│   ├── M9-compliance-management.md
│   └── M10-admin-panel.md
│
├── phase-3/                               ← Advanced features
│   ├── M11-integrations-layer.md
│   ├── M12-closing-title.md
│   └── M13-M14-reporting-secondary-market.md
│
└── phase-4/                               ← Innovation layer
    └── M15-M18-advanced-features.md
```

---

## Step 1 — Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Save your project URL and anon key
3. Enable Realtime in the Supabase dashboard:
   - Go to **Database → Replication**
   - Enable replication for: `loan_applications`, `documents`, `underwriting_decisions`, `conditions`, `tasks`, `messages`
4. Enable pgcrypto extension:
   ```sql
   -- Run in Supabase SQL editor
   create extension if not exists pgcrypto;
   ```

---

## Step 2 — Run Migrations (in exact order)

Open the **Supabase SQL Editor** and run each file in this order:

```
1.  migrations/000_shared_functions.sql
2.  migrations/core/001_organizations.sql
3.  migrations/core/002_profiles.sql
4.  migrations/core/003_branches.sql
5.  migrations/loan/001_pipeline_stages.sql
6.  migrations/loan/002_loan_applications.sql
7.  migrations/loan/003_borrower_details.sql
8.  migrations/property/001_properties.sql
9.  migrations/documents/001_documents.sql
10. migrations/underwriting/001_underwriting.sql
11. migrations/pricing/001_pricing.sql
12. migrations/comms/001_communications.sql
13. migrations/compliance/001_compliance.sql
14. migrations/closing/001_closing.sql
15. migrations/ai/001_ai.sql
```

> ⚠️ If any migration fails, check the error — it's almost always a missing extension or wrong execution order.

---

## Step 3 — Scaffold Your Next.js Project

```bash
npx create-next-app@latest nexuslend --typescript --tailwind --app --src-dir=false
cd nexuslend

# Install all dependencies
npm install \
  @supabase/supabase-js @supabase/ssr \
  @tanstack/react-query @tanstack/react-table \
  @dnd-kit/core @dnd-kit/sortable \
  @headlessui/react \
  react-hook-form @hookform/resolvers zod \
  zustand immer \
  lucide-react \
  clsx tailwind-merge \
  date-fns \
  resend \
  @anthropic-ai/sdk
```

---

## Step 4 — Set Up Environment Variables

Create `.env.local` in your project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic (server-side only)
ANTHROPIC_API_KEY=your-anthropic-key

# Resend (server-side only)
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_SECRET_KEY=your-32-char-random-secret-for-encryption
```

---

## Step 5 — Create the `cn()` Utility (First Thing)

```ts
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Step 6 — Create Supabase Clients

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export const createClient = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookies().get(name)?.value } }
  )
```

---

## How to Feed Files to an AI Agent

### For each module, feed in this order:

```
Agent prompt:
"Here are my project context files. Read them carefully before building anything."

[Paste 00-project-overview.md]
[Paste 01-database-schema.md]
[Paste the specific module file, e.g. phase-1/M1-auth-roles.md]

"Now implement this module exactly as specified."
```

### Recommended agent tools
- **Cursor** — best for multi-file code generation
- **Claude** (claude.ai) — best for architecture decisions + complex logic
- **v0.dev** — best for UI components (paste component spec from module file)

### Agent feeding order for hackathon

| Hour | Feed to agent | Goal |
|---|---|---|
| 0–1 | overview + schema + M1 | Scaffold + auth working |
| 1–3 | overview + schema + M2 | Borrower portal + application form |
| 3–5 | overview + schema + M4 | Claude AI integration |
| 5–7 | overview + schema + M3 | LO dashboard + pipeline |
| 7–9 | Polish + seed data | Demo-ready |
| 9–10 | Deploy to Vercel | Live URL |

---

## Seeding Demo Data

After migrations run, seed realistic data for the demo:

```sql
-- 1. Create demo organization
INSERT INTO organizations (name, slug, plan) VALUES ('First Community Bank', 'firstbank', 'pro');

-- 2. Create demo users via Supabase Auth dashboard, then:
-- INSERT profiles for: 1 admin, 2 loan officers, 1 processor, 3 borrowers

-- 3. Seed pipeline stages
SELECT seed_default_pipeline_stages('<your-org-id>');

-- 4. Create a sample loan in each pipeline stage for the demo
```

---

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables → add all from .env.local

# Set up custom domain (optional)
vercel domains add yourdomain.com
```

---

## Common Gotchas

| Issue | Fix |
|---|---|
| RLS blocks your queries | Make sure you're using server client (not anon client) for admin operations. Use service role key for seeding. |
| `attach_audit_triggers` not found | You forgot to run `000_shared_functions.sql` first |
| Realtime not working | Enable the table in Supabase Dashboard → Database → Replication |
| SSN encryption fails | Ensure pgcrypto extension is enabled and APP_SECRET_KEY is set |
| Auth session not in Server Components | Use `@supabase/ssr` package, not `@supabase/auth-helpers-nextjs` |
| Types out of sync | Run: `supabase gen types typescript --project-id your-project-id > types/database.ts` |

---

*NexusLend — Community Lender Mortgage Origination Platform*
*Generated: March 2026*
