# M1 — Auth & Roles
> Phase 1 · Must complete before any other module. Every other module depends on authenticated sessions and resolved roles.

## Prerequisites
- `00-project-overview.md` read
- `01-database-schema.md` read
- Supabase project created
- All migrations in `core/` folder executed in order

---

## Goal
Implement authentication (sign up, sign in, sign out, password reset) with role-based route protection for all 5 roles: `borrower`, `loan_officer`, `processor`, `underwriter`, `admin`.

---

## DB Tables Used
| Table | Operation |
|---|---|
| `auth.users` | Managed by Supabase Auth |
| `organizations` | Read — resolve org from slug/domain |
| `profiles` | Read/Write — created on first sign-in |

---

## Routes to Build

```
app/
├── (auth)/
│   ├── layout.tsx               # Centered auth layout, no nav
│   ├── login/
│   │   └── page.tsx             # Email + password sign in
│   ├── register/
│   │   └── page.tsx             # Borrower self-registration
│   ├── forgot-password/
│   │   └── page.tsx             # Send reset email
│   └── reset-password/
│       └── page.tsx             # Set new password (token from email)
└── middleware.ts                # Route protection + role redirect
```

---

## Components to Build

### `app/(auth)/login/page.tsx`
- Email + password fields
- React Hook Form + Zod validation
- On success: redirect based on role
  - `borrower` → `/(borrower)/dashboard`
  - All staff roles → `/(staff)/dashboard`
  - `admin` → `/(admin)/dashboard`
- Error states: invalid credentials, unverified email

### `app/(auth)/register/page.tsx`
- Borrower self-registration only (staff are invited by admin)
- Fields: first name, last name, email, phone, password, confirm password
- On success: create `profiles` row with `role = 'borrower'`
- Zod schema:
```ts
const registerSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  confirm_password: z.string()
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
})
```

### `middleware.ts`
```ts
// Protect routes based on role
// Public routes: /login, /register, /forgot-password, /reset-password
// /(borrower)/* → requires role = 'borrower'
// /(staff)/*    → requires role in ['loan_officer', 'processor', 'underwriter']
// /(admin)/*    → requires role = 'admin'
// Unauthenticated → redirect to /login
// Wrong role → redirect to correct dashboard
```

---

## Server Actions

### `lib/actions/auth.ts`

```ts
// signIn(email, password) → ActionResult<{ role: string }>
// signUp(data: RegisterInput) → ActionResult<{ userId: string }>
// signOut() → void
// resetPassword(email) → ActionResult<void>
// updatePassword(newPassword) → ActionResult<void>
```

### Profile creation on sign up
After `supabase.auth.signUp()` succeeds, immediately insert into `profiles`:
```ts
await supabase.from('profiles').insert({
  id: user.id,
  organization_id: resolvedOrgId,   // from subdomain or default org
  role: 'borrower',
  first_name: data.first_name,
  last_name: data.last_name,
  phone: data.phone
})
```

---

## Zustand Store

```ts
// stores/useAuthStore.ts
interface AuthStore {
  profile: Profile | null
  setProfile: (profile: Profile) => void
  clearProfile: () => void
  isRole: (role: Role | Role[]) => boolean
}
```

---

## Hooks

```ts
// hooks/useProfile.ts
// Returns current user's profile from TanStack Query
// Caches for 5 minutes — profile rarely changes mid-session
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => supabase.from('profiles').select('*').eq('id', userId).single()
  })
}
```

---

## Key Implementation Notes

1. **Organization resolution** — For MVP, hardcode a single `organization_id` as a constant. For multi-tenant, resolve from subdomain in middleware using `request.headers.get('host')`.

2. **Session persistence** — Use `@supabase/ssr` package. Set up cookie-based session in `middleware.ts` with `createServerClient` from `@supabase/ssr`. This is required for Server Components to access the session.

3. **Role is in `profiles`, not JWT** — Don't put role in Supabase JWT custom claims for MVP. Always fetch role from `profiles` table server-side. Caching in Zustand is fine client-side after first load.

4. **Staff invite flow (Phase 2)** — Admin sends invite email, staff member completes registration with pre-assigned role. For Phase 1/hackathon: manually insert staff profiles via Supabase dashboard.

5. **Password reset** — Supabase handles the email delivery. Configure redirect URL in Supabase Auth settings to point to `/reset-password`.

---

## Acceptance Criteria

- [ ] Borrower can register, receive confirmation email, and sign in
- [ ] Sign in redirects correctly based on role
- [ ] Unauthenticated requests to protected routes redirect to `/login`
- [ ] Wrong-role access redirects to correct dashboard
- [ ] Sign out clears session and redirects to `/login`
- [ ] Password reset email sends and reset flow works
- [ ] `profiles` row created on borrower registration

---

## Feeds Into
- M2 (Borrower Portal) — needs authenticated borrower session
- M3 (Loan Officer Dashboard) — needs authenticated LO session
- M10 (Admin Panel) — needs admin role enforcement
