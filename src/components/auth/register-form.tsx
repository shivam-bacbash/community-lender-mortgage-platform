"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    setServerSuccess(null);

    startTransition(async () => {
      const result = await signUp(values);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      form.reset();
      setServerSuccess(
        "Account created. Check your email for the confirmation link before signing in.",
      );
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError ? <Alert tone="error" message={serverError} /> : null}
      {serverSuccess ? <Alert tone="success" message={serverSuccess} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="first_name"
          label="First name"
          error={form.formState.errors.first_name?.message}
          required
        >
          <Input
            id="first_name"
            hasError={Boolean(form.formState.errors.first_name)}
            {...form.register("first_name")}
          />
        </Field>
        <Field
          id="last_name"
          label="Last name"
          error={form.formState.errors.last_name?.message}
          required
        >
          <Input
            id="last_name"
            hasError={Boolean(form.formState.errors.last_name)}
            {...form.register("last_name")}
          />
        </Field>
      </div>
      <Field id="email" label="Email" error={form.formState.errors.email?.message} required>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          hasError={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
      </Field>
      <Field
        id="phone"
        label="Phone"
        error={form.formState.errors.phone?.message}
        helperText="Optional. Used for status updates and loan communication."
      >
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          hasError={Boolean(form.formState.errors.phone)}
          {...form.register("phone")}
        />
      </Field>
      <Field
        id="password"
        label="Password"
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
        Create borrower account
      </Button>
      <p className="text-sm text-gray-600">
        Staff users are created by admins. <Link href="/login">Back to sign in</Link>.
      </p>
    </form>
  );
}
