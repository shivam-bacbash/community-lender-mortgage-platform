import { redirect } from "next/navigation";

import { ensureDefaultEmailTemplates } from "@/lib/notifications/templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDefaultUnderwritingRules } from "@/lib/underwriting/engine";
import type { UnderwritingRuleRecord } from "@/types/admin";
import type { EmailTemplateRecord } from "@/types/communications";

async function requireAdminContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/login");
  }

  return { supabase, profile };
}

export async function getAdminUnderwritingSettings() {
  const { supabase, profile } = await requireAdminContext();
  await ensureDefaultUnderwritingRules(profile.organization_id);

  const { data, error } = await supabase
    .from("underwriting_rules")
    .select("id, organization_id, loan_type, rule_name, rule_config, is_active, priority, description")
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .order("loan_type", { ascending: true })
    .order("priority", { ascending: true })
    .order("rule_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return {
    profile,
    rules: (data ?? []) as UnderwritingRuleRecord[],
  };
}

export async function getAdminEmailTemplates() {
  const { supabase, profile } = await requireAdminContext();
  await ensureDefaultEmailTemplates(profile.organization_id);

  const { data, error } = await supabase
    .from("email_templates")
    .select(
      "id, organization_id, trigger_event, subject, body_html, body_text, reply_to, variables, is_active, is_default, updated_at",
    )
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .order("trigger_event", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return {
    profile,
    templates: (data ?? []).map((template) => ({
      ...template,
      variables: Array.isArray(template.variables) ? template.variables : [],
    })) as EmailTemplateRecord[],
  };
}
