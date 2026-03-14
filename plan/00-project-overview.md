# 00-project-overview.md
> Feed this file to every agent before any module file. It defines the full project context, conventions, and non-negotiables.

---

## Project

**Product**: Community Lender Mortgage Origination Platform
**Codename**: NexusLend
**Type**: Multi-tenant SaaS — B2B, sold to community banks & credit unions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + Untitled UI components |
| UI Primitives | Headless UI (modals, dropdowns, comboboxes) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod + @hookform/resolvers |
| State | Zustand (slices: `useLoanStore`, `usePipelineStore`, `useUIStore`) |
| Server state | TanStack Query v5 |
| Tables | TanStack Table v8 |
| Drag & drop | @dnd-kit/core (kanban board) |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Email | Resend SDK |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Utilities | clsx + tailwind-merge → `cn()`, date-fns |
| Deployment | Vercel |

---

## Project Structure

```
/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, register, forgot-password)
│   ├── (borrower)/               # Borrower-facing routes
│   │   ├── dashboard/
│   │   ├── apply/                # Multi-step loan application
│   │   └── loans/[id]/           # Loan status tracker
│   ├── (staff)/                  # LO / Processor / UW routes
│   │   ├── dashboard/
│   │   ├── pipeline/             # Kanban board
│   │   └── loans/[id]/           # Full loan detail view
│   ├── (admin)/                  # Admin routes
│   │   ├── settings/
│   │   ├── users/
│   │   └── products/
│   └── api/                      # API routes (webhooks, integrations)
│       ├── webhooks/
│       └── ai/
├── components/
│   ├── ui/                       # Base Untitled UI components
│   ├── forms/                    # Reusable form components
│   ├── loan/                     # Loan-specific components
│   ├── pipeline/                 # Pipeline/kanban components
│   └── shared/                   # Layout, nav, modals
├── lib/
│   ├── supabase/                 # Supabase client + server instances
│   ├── ai/                       # Claude API wrapper
│   ├── validations/              # Zod schemas (shared client + server)
│   └── utils/                    # cn(), formatCurrency(), formatDate()
├── stores/                       # Zustand stores
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types (generated from DB)
└── supabase/
    └── migrations/               # All SQL migration files (see 01-database-schema.md)
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only, never expose to client

# Anthropic
ANTHROPIC_API_KEY=                  # Server-side only

# Resend
RESEND_API_KEY=                     # Server-side only
RESEND_FROM_EMAIL=

# App
NEXT_PUBLIC_APP_URL=
APP_SECRET_KEY=                     # Used for SSN pgcrypto encryption
```

---

## Supabase Client Setup

Two separate clients must be used — never mix them:

```ts
// lib/supabase/client.ts — browser client (use in Client Components)
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// lib/supabase/server.ts — server client (use in Server Components + Server Actions)
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

## `cn()` Utility

Always use this for merging Tailwind classes — required when extending Untitled UI components:

```ts
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Coding Conventions

### TypeScript
- Strict mode enabled. No `any`. Use `unknown` + type guards where needed.
- Generate DB types from Supabase: `supabase gen types typescript --local > types/database.ts`
- Always type server action return values explicitly.

### Components
- Server Components by default. Add `'use client'` only when needed (event handlers, hooks, browser APIs).
- Collocate component-specific hooks and types in the same folder.
- Use `loading.tsx` and `error.tsx` in every route segment.

### Forms
- All forms use React Hook Form + Zod.
- Define Zod schema first, derive TypeScript type with `z.infer<>`.
- Validate on both client (UX) and server (security).

### Server Actions
- Use for all mutations (create, update, status changes).
- Always revalidate relevant paths with `revalidatePath()` after mutations.
- Return typed `{ data, error }` objects — never throw from server actions.

### Data Fetching
- Use TanStack Query for client-side reads with caching.
- Use Server Components for initial page data (no loading spinner on first paint).
- Supabase Realtime subscriptions live in custom hooks inside `'use client'` components.

### Error Handling
```ts
// Standard server action return shape
type ActionResult<T> = 
  | { data: T; error: null }
  | { data: null; error: string }
```

### Currency & Dates
```ts
import { format } from 'date-fns'
// Currency
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
// Dates
format(new Date(dateStr), 'MMM d, yyyy')
```

---

## Multi-Tenancy Rules

- Every DB query MUST be scoped by `organization_id`. RLS enforces this but always filter explicitly too.
- `organization_id` is resolved from the authenticated user's profile on every request.
- Never pass `organization_id` from the client — always read it server-side from the session.

```ts
// Correct pattern in server action / route handler
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('organization_id, role')
  .eq('id', user.id)
  .single()
// Now use profile.organization_id in all subsequent queries
```

---

## Role Access Matrix

| Role | Route prefix | Key permissions |
|---|---|---|
| `borrower` | `/(borrower)/` | Submit application, upload docs, view own loan status |
| `loan_officer` | `/(staff)/` | View all org loans, manage pipeline, approve/deny |
| `processor` | `/(staff)/` | Process documents, manage conditions, order services |
| `underwriter` | `/(staff)/` | UW decisions, credit review, condition management |
| `admin` | `/(admin)/` | Full access, org settings, user management |

Middleware enforces route-level access. Check `middleware.ts` for redirect logic.

---

## AI Usage (Claude API)

All Claude API calls go through `lib/ai/claude.ts`. Never call the API directly from components.

```ts
// lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function analyzeApplication(payload: object) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: JSON.stringify(payload) }]
  })
  // Always store result in ai_analyses table before returning
  return response
}
```

Every AI call result MUST be stored in the `ai_analyses` table (append-only).

---

## Database Reference

See `01-database-schema.md` for:
- Full table list (31 tables)
- Migration execution order
- RLS policies
- Realtime-enabled tables
- Encryption requirements

---

*Stack: Next.js 14 · Supabase · Untitled UI · TanStack Query · Zustand · Claude API*
*Last updated: March 2026*
