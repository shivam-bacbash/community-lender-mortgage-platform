"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/profile";
import { getAppUrl } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegisterInput } from "@/lib/validations/auth";
import type { ActionResult, Role } from "@/types/auth";

function normalizeAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (lower.includes("email not confirmed")) {
    return "Your email address is not verified yet. Check your inbox and confirm your email first.";
  }

  if (lower.includes("password should be at least")) {
    return "Password must be at least 8 characters.";
  }

  return message;
}

async function getSignedInRole(): Promise<ActionResult<{ role: Role }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: "Unable to resolve the authenticated user." };
  }

  try {
    const profile = await getCurrentProfile(supabase, user);

    if (!profile) {
      return { data: null, error: "No profile was found for this account." };
    }

    return { data: { role: profile.role }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unable to resolve the user profile.",
    };
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<ActionResult<{ role: Role }>> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { data: null, error: normalizeAuthError(error.message) };
  }

  return getSignedInRole();
}

export async function signUp(
  data: RegisterInput,
): Promise<ActionResult<{ userId: string }>> {
  if (data.password !== data.confirm_password) {
    return { data: null, error: "Passwords do not match." };
  }

  const headerStore = await headers();
  const organizationHost = headerStore.get("host");
  const supabase = await createSupabaseServerClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone?.trim() || null,
        organization_host: organizationHost,
      },
      emailRedirectTo: `${getAppUrl()}/login`,
    },
  });

  if (signUpError) {
    return { data: null, error: normalizeAuthError(signUpError.message) };
  }

  const userId = signUpData.user?.id;

  if (!userId) {
    return { data: null, error: "Supabase did not return a user id for this signup." };
  }

  return { data: { userId }, error: null };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(email: string): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/reset-password`,
  });

  if (error) {
    return { data: null, error: normalizeAuthError(error.message) };
  }

  return { data: undefined, error: null };
}

export async function updatePassword(
  newPassword: string,
): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { data: null, error: normalizeAuthError(error.message) };
  }

  return { data: undefined, error: null };
}
