"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { getResendClient } from "@/lib/email/resend";
import { getAppUrl, getResendFromEmail } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  branchMemberSchema,
  branchSchema,
  changeUserRoleSchema,
  inviteStaffSchema,
  organizationSettingsSchema,
  reorderStagesSchema,
  stageSchema,
  toggleUserActiveSchema,
  type BranchInput,
  type ChangeUserRoleInput,
  type InviteStaffInput,
  type OrganizationSettingsInput,
  type StageInput,
  type ToggleUserActiveInput,
} from "@/lib/validations/admin";
import type { ActionResult } from "@/types/auth";

function adminClient() {
  return createSupabaseAdminClient();
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

async function requireAdminContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to continue.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Admin access is required.");
  }

  return { supabase, profile };
}

async function writeAuditLog(params: {
  organizationId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeState?: object;
  afterState?: object;
}) {
  await adminClient().from("audit_logs").insert({
    organization_id: params.organizationId,
    actor_id: params.actorId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    before_state: params.beforeState ?? {},
    after_state: params.afterState ?? {},
  });
}

function revalidateAdminPaths() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/branches");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/products");
  revalidatePath("/admin/templates");
  revalidatePath("/admin/settings");
}

function generateTemporaryPassword() {
  return `Temp-${randomBytes(6).toString("hex")}!`;
}

async function sendInviteEmail(email: string, params: { firstName: string; role: string; tempPassword: string }) {
  if (!process.env.RESEND_API_KEY) {
    return;
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: getResendFromEmail(),
    to: email,
    subject: "Your admin invite is ready",
    html: `
      <p>Hi ${params.firstName},</p>
      <p>You have been invited as ${params.role.replaceAll("_", " ")}.</p>
      <p>Temporary password: <strong>${params.tempPassword}</strong></p>
      <p>Sign in at <a href="${getAppUrl()}/login">${getAppUrl()}/login</a> and change your password immediately.</p>
    `,
  });
}

export async function inviteStaff(values: InviteStaffInput): Promise<ActionResult<{ profileId: string }>> {
  try {
    const payload = inviteStaffSchema.parse(values);
    const { profile } = await requireAdminContext();
    const admin = adminClient();

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("first_name", payload.first_name)
      .eq("last_name", payload.last_name)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (existingProfile?.id) {
      throw new Error("A matching profile already exists. Use the existing user instead.");
    }

    const tempPassword = generateTemporaryPassword();
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: payload.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: payload.first_name,
        last_name: payload.last_name,
      },
    });

    if (authError || !authUser.user) {
      throw new Error(authError?.message ?? "Unable to create auth user.");
    }

    const { data: createdProfile, error: profileError } = await admin
      .from("profiles")
      .insert({
        id: authUser.user.id,
        organization_id: profile.organization_id,
        role: payload.role,
        first_name: payload.first_name,
        last_name: payload.last_name,
        nmls_id: payload.nmls_id ?? null,
      })
      .select("id")
      .single();

    if (profileError || !createdProfile) {
      throw new Error(profileError?.message ?? "Unable to create profile.");
    }

    if (payload.branch_id) {
      const { error: branchError } = await admin.from("branch_members").insert({
        branch_id: payload.branch_id,
        profile_id: createdProfile.id,
        is_primary: true,
      });

      if (branchError) {
        throw new Error(branchError.message);
      }
    }

    await sendInviteEmail(payload.email, {
      firstName: payload.first_name,
      role: payload.role,
      tempPassword,
    }).catch(() => undefined);

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "admin.user_invited",
      resourceType: "profile",
      resourceId: createdProfile.id,
      afterState: {
        role: payload.role,
        branch_id: payload.branch_id ?? null,
      },
    });

    revalidateAdminPaths();
    return { data: { profileId: createdProfile.id }, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function changeUserRole(values: ChangeUserRoleInput): Promise<ActionResult<void>> {
  try {
    const payload = changeUserRoleSchema.parse(values);
    const { profile } = await requireAdminContext();
    const admin = adminClient();
    const { data: target, error } = await admin
      .from("profiles")
      .select("id, organization_id, role")
      .eq("id", payload.profileId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error || !target) {
      throw new Error(error?.message ?? "User not found.");
    }

    if (target.role === "admin" && payload.newRole !== "admin") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("role", "admin")
        .eq("is_active", true)
        .is("deleted_at", null);

      if ((count ?? 0) <= 1) {
        throw new Error("You cannot demote the last active admin.");
      }
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ role: payload.newRole })
      .eq("id", payload.profileId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "admin.user_role_changed",
      resourceType: "profile",
      resourceId: payload.profileId,
      beforeState: { role: target.role },
      afterState: { role: payload.newRole },
    });

    revalidateAdminPaths();
    revalidatePath(`/admin/users/${payload.profileId}`);
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function toggleUserActive(values: ToggleUserActiveInput): Promise<ActionResult<void>> {
  try {
    const payload = toggleUserActiveSchema.parse(values);
    const { profile } = await requireAdminContext();
    const admin = adminClient();
    const { data: target, error } = await admin
      .from("profiles")
      .select("id, organization_id, role, is_active")
      .eq("id", payload.profileId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error || !target) {
      throw new Error(error?.message ?? "User not found.");
    }

    if (target.role === "admin" && !payload.isActive) {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("role", "admin")
        .eq("is_active", true)
        .is("deleted_at", null);

      if ((count ?? 0) <= 1) {
        throw new Error("You cannot deactivate the last active admin.");
      }
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ is_active: payload.isActive })
      .eq("id", payload.profileId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: payload.isActive ? "admin.user_activated" : "admin.user_deactivated",
      resourceType: "profile",
      resourceId: payload.profileId,
      beforeState: { is_active: target.is_active },
      afterState: { is_active: payload.isActive },
    });

    revalidateAdminPaths();
    revalidatePath(`/admin/users/${payload.profileId}`);
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function resendInvite(profileId: string): Promise<ActionResult<void>> {
  try {
    const { profile } = await requireAdminContext();
    const admin = adminClient();
    const { data: target, error } = await admin
      .from("profiles")
      .select("id, organization_id, first_name, role")
      .eq("id", profileId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error || !target) {
      throw new Error(error?.message ?? "User not found.");
    }

    const authUser = await admin.auth.admin.getUserById(profileId);
    const email = authUser.data.user?.email;
    if (!email) {
      throw new Error("No email is available for this user.");
    }

    const tempPassword = generateTemporaryPassword();
    await admin.auth.admin.updateUserById(profileId, { password: tempPassword });
    await sendInviteEmail(email, {
      firstName: target.first_name,
      role: target.role,
      tempPassword,
    }).catch(() => undefined);

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "admin.user_invite_resent",
      resourceType: "profile",
      resourceId: profileId,
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${profileId}`);
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function saveBranch(values: BranchInput): Promise<ActionResult<{ branchId: string }>> {
  try {
    const payload = branchSchema.parse(values);
    const { profile } = await requireAdminContext();
    const admin = adminClient();
    const { data, error } = await admin
      .from("branches")
      .upsert(
        {
          id: payload.id,
          organization_id: profile.organization_id,
          name: payload.name,
          nmls_id: payload.nmls_id ?? null,
          phone: payload.phone ?? null,
          manager_id: payload.manager_id ?? null,
          is_active: payload.is_active,
          address: {
            street: payload.address_street ?? "",
            city: payload.address_city ?? "",
            state: payload.address_state ?? "",
            zip: payload.address_zip ?? "",
          },
        },
        { onConflict: "id" },
      )
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to save branch.");
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "admin.branch_saved",
      resourceType: "branch",
      resourceId: data.id,
      afterState: { name: payload.name, manager_id: payload.manager_id ?? null },
    });

    revalidateAdminPaths();
    revalidatePath(`/admin/branches/${data.id}`);
    return { data: { branchId: data.id }, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function addBranchMember(values: { branchId: string; profileId: string; isPrimary?: boolean }): Promise<ActionResult<void>> {
  try {
    const payload = branchMemberSchema.parse(values);
    const { profile } = await requireAdminContext();
    const admin = adminClient();

    if (payload.isPrimary) {
      await admin
        .from("branch_members")
        .update({ is_primary: false })
        .eq("profile_id", payload.profileId);
    }

    const { error } = await admin
      .from("branch_members")
      .upsert(
        {
          branch_id: payload.branchId,
          profile_id: payload.profileId,
          is_primary: payload.isPrimary,
        },
        { onConflict: "branch_id,profile_id" },
      );

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "admin.branch_member_added",
      resourceType: "branch",
      resourceId: payload.branchId,
      afterState: { profile_id: payload.profileId, is_primary: payload.isPrimary },
    });

    revalidatePath("/admin/branches");
    revalidatePath(`/admin/branches/${payload.branchId}`);
    revalidatePath("/admin/users");
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function removeBranchMember(branchId: string, profileId: string): Promise<ActionResult<void>> {
  try {
    const { profile } = await requireAdminContext();
    const admin = adminClient();
    const { error } = await admin
      .from("branch_members")
      .delete()
      .eq("branch_id", branchId)
      .eq("profile_id", profileId);

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "admin.branch_member_removed",
      resourceType: "branch",
      resourceId: branchId,
      afterState: { profile_id: profileId },
    });

    revalidatePath("/admin/branches");
    revalidatePath(`/admin/branches/${branchId}`);
    revalidatePath("/admin/users");
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function savePipelineStage(values: StageInput): Promise<ActionResult<{ stageId: string }>> {
  try {
    const payload = stageSchema.parse(values);
    const { profile } = await requireAdminContext();
    const admin = adminClient();
    const { count } = await admin
      .from("pipeline_stages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null);

    const { data, error } = await admin
      .from("pipeline_stages")
      .upsert(
        {
          id: payload.id,
          organization_id: profile.organization_id,
          name: payload.name,
          color: payload.color,
          description: payload.description ?? null,
          order_index: payload.id ? undefined : (count ?? 0) + 1,
          sla_days: payload.sla_days ?? null,
          is_terminal: payload.is_terminal,
          terminal_outcome: payload.is_terminal ? payload.terminal_outcome ?? null : null,
        },
        { onConflict: "id" },
      )
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to save stage.");
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "admin.pipeline_stage_saved",
      resourceType: "pipeline_stage",
      resourceId: data.id,
      afterState: payload,
    });

    revalidatePath("/admin/pipeline");
    revalidatePath("/staff/pipeline");
    return { data: { stageId: data.id }, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function reorderStages(stageIds: string[]): Promise<ActionResult<void>> {
  try {
    const payload = reorderStagesSchema.parse({ stageIds });
    const { profile } = await requireAdminContext();
    const admin = adminClient();

    await Promise.all(
      payload.stageIds.map((stageId, index) =>
        admin
          .from("pipeline_stages")
          .update({ order_index: index + 1 })
          .eq("id", stageId)
          .eq("organization_id", profile.organization_id),
      ),
    );

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "admin.pipeline_reordered",
      resourceType: "organization",
      resourceId: profile.organization_id,
      afterState: { stage_ids: payload.stageIds },
    });

    revalidatePath("/admin/pipeline");
    revalidatePath("/staff/pipeline");
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function deletePipelineStage(stageId: string): Promise<ActionResult<void>> {
  try {
    const { profile } = await requireAdminContext();
    const admin = adminClient();
    const { count } = await admin
      .from("loan_applications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("pipeline_stage_id", stageId)
      .is("deleted_at", null);

    if ((count ?? 0) > 0) {
      throw new Error("You cannot delete a stage that still has active loans.");
    }

    const { error } = await admin
      .from("pipeline_stages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", stageId)
      .eq("organization_id", profile.organization_id);

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "admin.pipeline_stage_deleted",
      resourceType: "pipeline_stage",
      resourceId: stageId,
    });

    revalidatePath("/admin/pipeline");
    revalidatePath("/staff/pipeline");
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

async function ensureBrandingBucket() {
  const admin = adminClient();
  const { data } = await admin.storage.getBucket("branding");
  if (!data) {
    await admin.storage.createBucket("branding", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
    });
  }
  return admin;
}

export async function saveOrganizationSettings(
  values: OrganizationSettingsInput,
  logoFile?: File | null,
): Promise<ActionResult<void>> {
  try {
    const payload = organizationSettingsSchema.parse(values);
    const { profile } = await requireAdminContext();
    const admin = await ensureBrandingBucket();
    let logoUrl: string | null | undefined;

    if (logoFile && logoFile.size > 0) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const objectPath = `${profile.organization_id}/logo-${Date.now()}-${logoFile.name}`;
      const { error: uploadError } = await admin.storage.from("branding").upload(objectPath, buffer, {
        contentType: logoFile.type || "application/octet-stream",
        upsert: true,
      });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrl } = admin.storage.from("branding").getPublicUrl(objectPath);
      logoUrl = publicUrl.publicUrl;
    }

    const { data: orgBefore } = await admin
      .from("organizations")
      .select("name, slug, plan, logo_url, brand_colors, settings")
      .eq("id", profile.organization_id)
      .single();

    const { error } = await admin
      .from("organizations")
      .update({
        name: payload.name,
        slug: payload.slug,
        plan: payload.plan,
        ...(logoUrl ? { logo_url: logoUrl } : {}),
        brand_colors: {
          primary: payload.primary_color,
          secondary: payload.secondary_color,
          accent: payload.accent_color,
        },
        settings: {
          nmls_id: payload.nmls_id ?? "",
          default_assignment_mode: payload.default_assignment_mode,
          feature_flags: {
            ai_prequalification: payload.ai_prequalification,
            sms_notifications: payload.sms_notifications,
            secondary_market: payload.secondary_market,
          },
        },
      })
      .eq("id", profile.organization_id);

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "admin.organization_settings_saved",
      resourceType: "organization",
      resourceId: profile.organization_id,
      beforeState: orgBefore ?? {},
      afterState: {
        name: payload.name,
        slug: payload.slug,
        plan: payload.plan,
      },
    });

    revalidateAdminPaths();
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}
