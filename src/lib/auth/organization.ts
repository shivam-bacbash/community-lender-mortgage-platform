import { headers } from "next/headers";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const DEFAULT_ORGANIZATION_SLUG = "default";

function getCandidateSlugFromHost(host: string | null) {
  if (!host) {
    return DEFAULT_ORGANIZATION_SLUG;
  }

  const hostname = host.split(":")[0];
  const parts = hostname.split(".");

  if (parts.length > 2) {
    return parts[0] || DEFAULT_ORGANIZATION_SLUG;
  }

  return DEFAULT_ORGANIZATION_SLUG;
}

export async function resolveOrganizationId() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const candidateSlug = getCandidateSlugFromHost(host);
  const supabase = createSupabaseAdminClient();

  const { data: bySlug } = await supabase
    .from("organizations")
    .select("id")
    .or(`slug.eq.${candidateSlug},custom_domain.eq.${host ?? ""}`)
    .eq("is_active", true)
    .maybeSingle();

  if (bySlug?.id) {
    return bySlug.id;
  }

  const { data: fallback, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !fallback?.id) {
    throw new Error(
      "No active organization found. Seed an organization before allowing borrower registration.",
    );
  }

  return fallback.id;
}
