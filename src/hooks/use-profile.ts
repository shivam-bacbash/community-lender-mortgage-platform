"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuthStore } from "@/stores/use-auth-store";
import type { Profile } from "@/types/auth";

export function useProfile() {
  const setProfile = useAuthStore((state) => state.setProfile);
  const clearProfile = useAuthStore((state) => state.clearProfile);
  const supabase = createSupabaseBrowserClient();

  const query = useQuery({
    queryKey: ["profile"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, organization_id, role, first_name, last_name, phone, avatar_url, is_active, created_at, updated_at",
        )
        .eq("id", user.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Profile;
    },
  });

  useEffect(() => {
    if (query.data) {
      setProfile(query.data);
      return;
    }

    if (query.data === null) {
      clearProfile();
    }
  }, [clearProfile, query.data, setProfile]);

  return query;
}
