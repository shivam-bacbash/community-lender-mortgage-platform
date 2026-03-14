import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Borrower Registration"
      title="Create a borrower account"
      description="Borrowers can self-register here. Staff users are created separately by an admin."
    >
      <RegisterForm />
    </AuthShell>
  );
}
