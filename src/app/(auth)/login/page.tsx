import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Community Lender"
      title="Sign in to NexusLend"
      description="Use your email and password to access the borrower portal, staff workspace, or admin dashboard."
    >
      <LoginForm />
    </AuthShell>
  );
}
