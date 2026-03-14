import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password Recovery"
      title="Reset your password"
      description="Supabase will email you a recovery link. Use the same email address tied to your account."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
