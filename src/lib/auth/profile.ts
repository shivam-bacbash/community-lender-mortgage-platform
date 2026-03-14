import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Profile, Role } from "@/types/auth";

export async function getProfileForUser(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, organization_id, role, first_name, last_name, phone, avatar_url, is_active, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Profile | null) ?? null;
}

export async function getCurrentProfile(
  supabase: SupabaseClient,
  user: User | null,
) {
  if (!user) {
    return null;
  }

  return getProfileForUser(supabase, user.id);
}

export function isRole(role: Role, allowed: Role | Role[]) {
  if (Array.isArray(allowed)) {
    return allowed.includes(role);
  }

  return role === allowed;
}
