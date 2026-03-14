import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password Reset"
      title="Choose a new password"
      description="Open this page from the recovery email so Supabase can attach the recovery session before you submit the new password."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
