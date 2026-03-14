"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/actions/auth";
import { getDashboardPathForRole } from "@/lib/auth/roles";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      const result = await signIn(values.email, values.password);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      const role = result.data?.role;

      if (!role) {
        setServerError("Signed in successfully, but the role could not be resolved.");
        return;
      }

      router.replace(getDashboardPathForRole(role));
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError ? <Alert tone="error" message={serverError} /> : null}
      <Field id="email" label="Email" error={form.formState.errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          hasError={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
      </Field>
      <Field
        id="password"
        label="Password"
        error={form.formState.errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          hasError={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
      </Field>
      <Button className="w-full" type="submit" loading={isPending}>
        Sign in
      </Button>
      <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
        <Link href="/forgot-password" className="hover:text-gray-900">
          Forgot password?
        </Link>
        <Link href="/register" className="hover:text-gray-900">
          Create borrower account
        </Link>
      </div>
    </form>
  );
}
