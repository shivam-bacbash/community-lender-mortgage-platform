"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ensureDefaultEmailTemplates } from "@/lib/notifications/templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { pgUuidSchema } from "@/lib/validations/shared";
import type { ActionResult } from "@/types/auth";
import type { EmailTemplateRecord } from "@/types/communications";

const emailTemplateSchema = z.object({
  id: pgUuidSchema.optional(),
  trigger_event: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  body_html: z.string().min(1).max(20000),
  body_text: z.string().max(10000).optional(),
  reply_to: z
    .string()
    .email()
    .optional()
    .or(z.literal("")),
  is_active: z.boolean(),
});

async function requireAuthenticatedProfile() {
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
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found.");
  }

  return profile;
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function markNotificationRead(notificationId: string): Promise<ActionResult<void>> {
  try {
    const profile = await requireAuthenticatedProfile();
    const { error } = await createSupabaseAdminClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("recipient_id", profile.id)
      .is("read_at", null);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/borrower/dashboard");
    revalidatePath("/staff/dashboard");

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult<void>> {
  try {
    const profile = await requireAuthenticatedProfile();
    const { error } = await createSupabaseAdminClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", profile.id)
      .is("read_at", null);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/borrower/dashboard");
    revalidatePath("/staff/dashboard");

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function saveEmailTemplate(
  values: z.input<typeof emailTemplateSchema>,
): Promise<ActionResult<EmailTemplateRecord>> {
  try {
    const payload = emailTemplateSchema.parse(values);
    const profile = await requireAuthenticatedProfile();

    if (profile.role !== "admin") {
      throw new Error("Admin access is required.");
    }

    await ensureDefaultEmailTemplates(profile.organization_id);
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("email_templates")
      .upsert(
        {
          id: payload.id,
          organization_id: profile.organization_id,
          trigger_event: payload.trigger_event,
          subject: payload.subject,
          body_html: payload.body_html,
          body_text: payload.body_text || null,
          reply_to: payload.reply_to || null,
          is_active: payload.is_active,
        },
        { onConflict: "organization_id,trigger_event" },
      )
      .select(
        "id, organization_id, trigger_event, subject, body_html, body_text, reply_to, variables, is_active, is_default, updated_at",
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to save the template.");
    }

    revalidatePath("/admin/templates");

    return {
      data: {
        ...data,
        variables: Array.isArray(data.variables) ? data.variables : [],
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}
