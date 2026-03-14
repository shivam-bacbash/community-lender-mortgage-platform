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
import { updatePassword } from "@/lib/actions/auth";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    setServerSuccess(null);

    startTransition(async () => {
      const result = await updatePassword(values.password);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      form.reset();
      setServerSuccess("Password updated. Redirecting to sign in.");
      window.setTimeout(() => {
        router.replace("/login");
      }, 1200);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError ? <Alert tone="error" message={serverError} /> : null}
      {serverSuccess ? <Alert tone="success" message={serverSuccess} /> : null}
      <Field
        id="password"
        label="New password"
        error={form.formState.errors.password?.message}
        required
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          hasError={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
      </Field>
      <Field
        id="confirm_password"
        label="Confirm password"
        error={form.formState.errors.confirm_password?.message}
        required
      >
        <Input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          hasError={Boolean(form.formState.errors.confirm_password)}
          {...form.register("confirm_password")}
        />
      </Field>
      <Button className="w-full" type="submit" loading={isPending}>
        Update password
      </Button>
      <p className="text-sm text-gray-600">
        Need a fresh recovery email? <Link href="/forgot-password">Request one</Link>.
      </p>
    </form>
  );
}
