# Module 10 Test Plan: Admin Panel

## Scope
- Admin dashboard metrics and navigation shell
- User invitation, role changes, activation toggles, and invite resend
- Branch create/edit and branch membership management
- Pipeline stage create/edit/reorder/delete
- Organization settings, branding, feature flags, and admin route access

## Test Accounts
- `admin.demo@nexuslend.local` / `Password123!`
- `loan.officer.demo@nexuslend.local` / `Password123!`
- `processor.demo@nexuslend.local` / `Password123!`

## Test Cases
1. Sign in as `admin.demo@nexuslend.local` and open `/admin/dashboard`.
Expected: admin shell renders, metrics cards load, recent users list is visible, and left-nav links work.

2. Open `/admin/users` and invite a new `loan_officer`.
Expected: user is created, appears in the list, optional branch assignment sticks, and a success message is shown.

3. Open the invited user detail page and change the role to `processor`, then deactivate and reactivate the user.
Expected: each action succeeds and the page refreshes with the updated role/status.

4. Attempt to demote or deactivate the last active admin.
Expected: the action is blocked with an error explaining that the last active admin cannot be changed that way.

5. Open `/admin/branches`, create a branch, then open its detail page.
Expected: branch appears in the list, detail page loads, and branch settings save successfully.

6. On the branch detail page, add a staff member and then remove that member.
Expected: membership list updates after each action and the user/branch state stays in sync.

7. Open `/admin/pipeline`, add a new stage, edit its SLA/color, and save it.
Expected: the stage persists after refresh and appears in the staff pipeline ordering.

8. Drag stages into a new order.
Expected: the new order persists after refresh.

9. Try to delete a stage that still has active loans.
Expected: deletion is blocked with the stage-in-use error.

10. Open `/admin/settings`, update brand colors, plan, assignment mode, feature flags, and optionally upload a logo.
Expected: settings save successfully and the preview/organization data reflect the changes after refresh.

11. Sign in as a non-admin user and navigate to `/admin/users` or `/admin/settings`.
Expected: access is denied and the user is redirected away from admin routes.
