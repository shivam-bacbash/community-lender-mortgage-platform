"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/actions/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    setServerSuccess(null);

    startTransition(async () => {
      const result = await resetPassword(values.email);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      setServerSuccess("Password reset email sent. Check your inbox for the recovery link.");
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError ? <Alert tone="error" message={serverError} /> : null}
      {serverSuccess ? <Alert tone="success" message={serverSuccess} /> : null}
      <Field
        id="email"
        label="Email"
        error={form.formState.errors.email?.message}
        helperText="We will send a password recovery link to this address."
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          hasError={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
      </Field>
      <Button className="w-full" type="submit" loading={isPending}>
        Send reset email
      </Button>
      <p className="text-sm text-gray-600">
        <Link href="/login">Back to sign in</Link>
      </p>
    </form>
  );
}
