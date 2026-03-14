import { redirect } from "next/navigation";

import { ensureDefaultEmailTemplates } from "@/lib/notifications/templates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDefaultUnderwritingRules } from "@/lib/underwriting/engine";
import type {
  AdminBranchRecord,
  AdminDashboardMetric,
  AdminOrganizationSettings,
  AdminPipelineStageRecord,
  AdminUserRecord,
  UnderwritingRuleRecord,
} from "@/types/admin";
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

export async function getAdminShellData() {
  const { profile } = await requireAdminContext();
  return profile;
}

function adminClient() {
  return createSupabaseAdminClient();
}

async function ensurePipelineStages(organizationId: string) {
  const admin = adminClient();
  const { count } = await admin
    .from("pipeline_stages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if ((count ?? 0) === 0) {
    await admin.rpc("seed_default_pipeline_stages", { org_id: organizationId });
  }
}

async function getAuthUserMap(userIds: string[]) {
  if (!userIds.length) {
    return new Map<string, { email: string | null; lastActiveAt: string | null }>();
  }

  const admin = adminClient();
  const pages = await Promise.all([1, 2, 3].map((page) => admin.auth.admin.listUsers({ page, perPage: 100 })));
  const users = pages.flatMap((page) => page.data.users ?? []);

  return new Map(
    users
      .filter((user) => userIds.includes(user.id))
      .map((user) => [
        user.id,
        {
          email: user.email ?? null,
          lastActiveAt: user.last_sign_in_at ?? null,
        },
      ]),
  );
}

export async function getAdminDashboardData(): Promise<{
  profile: { id: string; organization_id: string; role: string; first_name: string; last_name: string };
  metrics: AdminDashboardMetric[];
  recentUsers: AdminUserRecord[];
}> {
  const { supabase, profile } = await requireAdminContext();
  await ensurePipelineStages(profile.organization_id);

  const [userCount, branchCount, productCount, activeLoans, recentProfiles] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
    supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
    supabase
      .from("loan_products")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
    supabase
      .from("loan_applications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .not("status", "in", '("funded","denied","withdrawn","cancelled")'),
    supabase
      .from("profiles")
      .select("id, organization_id, first_name, last_name, role, is_active, created_at")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const authMap = await getAuthUserMap((recentProfiles.data ?? []).map((item) => item.id));

  return {
    profile,
    metrics: [
      { label: "Users", value: userCount.count ?? 0, helper: "Profiles in this organization" },
      { label: "Branches", value: branchCount.count ?? 0, helper: "Active and inactive branch records" },
      { label: "Products", value: productCount.count ?? 0, helper: "Configured loan products" },
      { label: "Active loans", value: activeLoans.count ?? 0, helper: "Loans currently in the pipeline" },
    ],
    recentUsers: (recentProfiles.data ?? []).map((item) => ({
      id: item.id,
      organization_id: item.organization_id,
      first_name: item.first_name,
      last_name: item.last_name,
      role: item.role,
      email: authMap.get(item.id)?.email ?? null,
      branch_name: null,
      branch_id: null,
      is_active: item.is_active,
      created_at: item.created_at,
      last_active_at: authMap.get(item.id)?.lastActiveAt ?? null,
      invitation_sent_at: item.created_at,
    })),
  };
}

export async function getAdminUsersData(filters?: {
  role?: string;
  branch?: string;
  status?: string;
}) {
  const { supabase, profile } = await requireAdminContext();
  const [profilesResult, branchMembersResult, branchesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, organization_id, first_name, last_name, role, is_active, created_at")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("branch_members")
      .select("profile_id, branch_id, is_primary")
      .is("deleted_at", null),
    supabase
      .from("branches")
      .select("id, name")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
  ]);

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }

  const authMap = await getAuthUserMap((profilesResult.data ?? []).map((item) => item.id));
  const branchNameMap = new Map((branchesResult.data ?? []).map((branch) => [branch.id, branch.name]));
  const primaryBranchMap = new Map<string, { branchId: string; branchName: string | null }>();
  for (const member of branchMembersResult.data ?? []) {
    if (member.is_primary && !primaryBranchMap.has(member.profile_id)) {
      primaryBranchMap.set(member.profile_id, {
        branchId: member.branch_id,
        branchName: branchNameMap.get(member.branch_id) ?? null,
      });
    }
  }

  const rows = (profilesResult.data ?? [])
    .map((item) => ({
      id: item.id,
      organization_id: item.organization_id,
      first_name: item.first_name,
      last_name: item.last_name,
      role: item.role,
      email: authMap.get(item.id)?.email ?? null,
      branch_name: primaryBranchMap.get(item.id)?.branchName ?? null,
      branch_id: primaryBranchMap.get(item.id)?.branchId ?? null,
      is_active: item.is_active,
      created_at: item.created_at,
      last_active_at: authMap.get(item.id)?.lastActiveAt ?? null,
      invitation_sent_at: item.created_at,
    }))
    .filter((item) => {
      if (filters?.role && item.role !== filters.role) {
        return false;
      }
      if (filters?.branch && item.branch_id !== filters.branch) {
        return false;
      }
      if (filters?.status === "active" && !item.is_active) {
        return false;
      }
      if (filters?.status === "inactive" && item.is_active) {
        return false;
      }
      return true;
    });

  return {
    profile,
    users: rows as AdminUserRecord[],
    branchOptions: (branchesResult.data ?? []).map((branch) => ({ id: branch.id, name: branch.name })),
  };
}

export async function getAdminUserDetail(userId: string) {
  const { supabase, profile } = await requireAdminContext();
  const [profileResult, branchMembersResult, branchesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, organization_id, first_name, last_name, role, is_active, created_at, nmls_id")
      .eq("id", userId)
      .eq("organization_id", profile.organization_id)
      .single(),
    supabase
      .from("branch_members")
      .select("id, branch_id, is_primary")
      .eq("profile_id", userId)
      .is("deleted_at", null),
    supabase
      .from("branches")
      .select("id, name")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
  ]);

  if (profileResult.error || !profileResult.data) {
    throw new Error(profileResult.error?.message ?? "User not found.");
  }

  const authMap = await getAuthUserMap([userId]);
  const branchNameMap = new Map((branchesResult.data ?? []).map((branch) => [branch.id, branch.name]));

  return {
    profile,
    user: {
      id: profileResult.data.id,
      organization_id: profileResult.data.organization_id,
      first_name: profileResult.data.first_name,
      last_name: profileResult.data.last_name,
      role: profileResult.data.role,
      email: authMap.get(userId)?.email ?? null,
      branch_name: null,
      branch_id: null,
      is_active: profileResult.data.is_active,
      created_at: profileResult.data.created_at,
      last_active_at: authMap.get(userId)?.lastActiveAt ?? null,
      invitation_sent_at: profileResult.data.created_at,
    } as AdminUserRecord,
    nmls_id: profileResult.data.nmls_id,
    memberships: (branchMembersResult.data ?? []).map((membership) => ({
      id: membership.id,
      branch_id: membership.branch_id,
      branch_name: branchNameMap.get(membership.branch_id) ?? "Unknown branch",
      is_primary: membership.is_primary,
    })),
    branches: branchesResult.data ?? [],
  };
}

export async function getAdminBranchesData() {
  const { supabase, profile } = await requireAdminContext();
  const [branchesResult, branchMembersResult, profilesResult] = await Promise.all([
    supabase
      .from("branches")
      .select("id, organization_id, name, nmls_id, phone, is_active, manager_id, address")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("branch_members")
      .select("branch_id, profile_id")
      .is("deleted_at", null),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
  ]);

  const nameMap = new Map((profilesResult.data ?? []).map((item) => [item.id, `${item.first_name} ${item.last_name}`.trim()]));
  const memberCounts = new Map<string, number>();
  for (const membership of branchMembersResult.data ?? []) {
    memberCounts.set(membership.branch_id, (memberCounts.get(membership.branch_id) ?? 0) + 1);
  }

  return {
    profile,
    branches: (branchesResult.data ?? []).map((branch) => ({
      id: branch.id,
      organization_id: branch.organization_id,
      name: branch.name,
      nmls_id: branch.nmls_id,
      phone: branch.phone,
      is_active: branch.is_active,
      manager_id: branch.manager_id,
      manager_name: branch.manager_id ? nameMap.get(branch.manager_id) ?? null : null,
      member_count: memberCounts.get(branch.id) ?? 0,
      address:
        branch.address && typeof branch.address === "object" && !Array.isArray(branch.address)
          ? (branch.address as AdminBranchRecord["address"])
          : null,
    })) as AdminBranchRecord[],
    managerOptions: (profilesResult.data ?? []).map((item) => ({
      id: item.id,
      label: `${item.first_name} ${item.last_name}`.trim(),
    })),
  };
}

export async function getAdminBranchDetail(branchId: string) {
  const { supabase, profile } = await requireAdminContext();
  const [branchResult, branchMembersResult, profilesResult] = await Promise.all([
    supabase
      .from("branches")
      .select("id, organization_id, name, nmls_id, phone, is_active, manager_id, address")
      .eq("id", branchId)
      .eq("organization_id", profile.organization_id)
      .single(),
    supabase
      .from("branch_members")
      .select("id, branch_id, profile_id, is_primary")
      .eq("branch_id", branchId)
      .is("deleted_at", null),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, role, is_active")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .order("first_name", { ascending: true }),
  ]);

  if (branchResult.error || !branchResult.data) {
    throw new Error(branchResult.error?.message ?? "Branch not found.");
  }

  const authMap = await getAuthUserMap((profilesResult.data ?? []).map((item) => item.id));
  const profileMap = new Map(
    (profilesResult.data ?? []).map((item) => [
      item.id,
      {
        id: item.id,
        name: `${item.first_name} ${item.last_name}`.trim(),
        role: item.role,
        is_active: item.is_active,
        email: authMap.get(item.id)?.email ?? null,
      },
    ]),
  );

  return {
    profile,
    branch: {
      id: branchResult.data.id,
      organization_id: branchResult.data.organization_id,
      name: branchResult.data.name,
      nmls_id: branchResult.data.nmls_id,
      phone: branchResult.data.phone,
      is_active: branchResult.data.is_active,
      manager_id: branchResult.data.manager_id,
      manager_name: branchResult.data.manager_id ? profileMap.get(branchResult.data.manager_id)?.name ?? null : null,
      member_count: branchMembersResult.data?.length ?? 0,
      address:
        branchResult.data.address && typeof branchResult.data.address === "object" && !Array.isArray(branchResult.data.address)
          ? (branchResult.data.address as AdminBranchRecord["address"])
          : null,
    } as AdminBranchRecord,
    members: (branchMembersResult.data ?? []).map((member) => ({
      id: member.id,
      profile_id: member.profile_id,
      is_primary: member.is_primary,
      name: profileMap.get(member.profile_id)?.name ?? "Unknown user",
      role: profileMap.get(member.profile_id)?.role ?? "unknown",
      is_active: profileMap.get(member.profile_id)?.is_active ?? false,
      email: profileMap.get(member.profile_id)?.email ?? null,
    })),
    staffOptions: (profilesResult.data ?? [])
      .filter((item) => item.role !== "borrower")
      .map((item) => ({
        id: item.id,
        label: `${item.first_name} ${item.last_name}`.trim(),
        role: item.role,
      })),
  };
}

export async function getAdminPipelineStages() {
  const { supabase, profile } = await requireAdminContext();
  await ensurePipelineStages(profile.organization_id);

  const [stagesResult, loanCountsResult] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("id, organization_id, name, color, description, order_index, sla_days, is_terminal, terminal_outcome")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .order("order_index", { ascending: true }),
    supabase
      .from("loan_applications")
      .select("pipeline_stage_id")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null),
  ]);

  if (stagesResult.error) {
    throw new Error(stagesResult.error.message);
  }

  const stageCounts = new Map<string, number>();
  for (const loan of loanCountsResult.data ?? []) {
    if (loan.pipeline_stage_id) {
      stageCounts.set(loan.pipeline_stage_id, (stageCounts.get(loan.pipeline_stage_id) ?? 0) + 1);
    }
  }

  return {
    profile,
    stages: (stagesResult.data ?? []).map((stage) => ({
      ...stage,
      active_loan_count: stageCounts.get(stage.id) ?? 0,
    })) as AdminPipelineStageRecord[],
  };
}

export async function getAdminOrganizationSettings() {
  const { supabase, profile } = await requireAdminContext();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url, plan, brand_colors, settings")
    .eq("id", profile.organization_id)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Organization not found.");
  }

  return {
    profile,
    organization: {
      organizationId: data.id,
      name: data.name,
      slug: data.slug,
      logo_url: data.logo_url,
      plan: data.plan,
      brand_colors:
        data.brand_colors && typeof data.brand_colors === "object" && !Array.isArray(data.brand_colors)
          ? (data.brand_colors as AdminOrganizationSettings["brand_colors"])
          : null,
      settings:
        data.settings && typeof data.settings === "object" && !Array.isArray(data.settings)
          ? (data.settings as AdminOrganizationSettings["settings"])
          : null,
    } as AdminOrganizationSettings,
  };
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
