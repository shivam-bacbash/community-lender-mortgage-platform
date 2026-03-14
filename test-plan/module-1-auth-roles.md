# Module 1 Test Plan: Auth & Roles

## Scope
Validate the Phase 1 auth module in `plan/phase-1/M1-auth-roles.md`: borrower registration, login, logout, password reset, session protection, and role-based redirects.

## Prerequisites
- Run `npm install`
- Set local env from `.env.local`
- Start the app with `npm run dev`
- Confirm Supabase is reachable and seeded test users exist

## Test Accounts
Use `Password123!` for all seeded accounts.

- `borrower.demo@nexuslend.local`
- `loan.officer.demo@nexuslend.local`
- `processor.demo@nexuslend.local`
- `underwriter.demo@nexuslend.local`
- `admin.demo@nexuslend.local`

## Core Flows
### 1. Borrower registration
1. Open `/register`.
2. Submit valid borrower details with a new email.
3. Confirm the success state or email-verification message.
4. Verify a matching `profiles` row exists with `role = borrower`.

Expected: registration succeeds, no staff roles can be self-created, and the borrower profile is created.

### 2. Login and role redirect
Test `/login` with each seeded account.

Expected:
- borrower -> `/borrower/dashboard`
- loan officer -> `/staff/dashboard`
- processor -> `/staff/dashboard`
- underwriter -> `/staff/dashboard`
- admin -> `/admin/dashboard`

### 3. Protected routes
While signed out, open:
- `/borrower/dashboard`
- `/staff/dashboard`
- `/admin/dashboard`

Expected: each request redirects to `/login`.

### 4. Wrong-role access
While signed in, try accessing a dashboard for another role.

Expected:
- borrower hitting `/admin/dashboard` or `/staff/dashboard` is redirected to `/borrower/dashboard`
- staff hitting `/admin/dashboard` is redirected to `/staff/dashboard`
- admin hitting borrower or staff routes is redirected to `/admin/dashboard`

### 5. Logout
Trigger sign out from an authenticated session.

Expected: session is cleared and the app redirects to `/login`.

### 6. Password reset
1. Open `/forgot-password`.
2. Request a reset email.
3. Follow the email link to `/reset-password`.
4. Set a new password and log in with it.

Expected: reset email sends, password updates, old password fails, new password succeeds.
