import { getResendClient } from "@/lib/email/resend";
import { getResendFromEmail } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { ensureDefaultEmailTemplates, mergeTemplate } from "./templates";

type NotificationResourceType = "loan" | "task" | "document" | "message" | "condition";

type CreateNotificationParams = {
  organizationId: string;
  recipientId: string;
  type: string;
  title: string;
  body?: string | null;
  actionUrl?: string | null;
  resourceType?: NotificationResourceType | null;
  resourceId?: string | null;
  emailTriggerEvent?: string;
  emailVariables?: Record<string, string | number | null | undefined>;
};

async function appendSentVia(notificationId: string, channel: string) {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("notifications")
    .select("sent_via")
    .eq("id", notificationId)
    .maybeSingle();

  const nextChannels = [...new Set([...(existing?.sent_via ?? ["in_app"]), channel])];
  await admin.from("notifications").update({ sent_via: nextChannels }).eq("id", notificationId);
}

export async function sendTemplatedEmail(params: {
  organizationId: string;
  recipientId: string;
  triggerEvent: string;
  variables: Record<string, string | number | null | undefined>;
  notificationId?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    return false;
  }

  const admin = createSupabaseAdminClient();
  await ensureDefaultEmailTemplates(params.organizationId);

  const [{ data: template, error: templateError }, userResult] = await Promise.all([
    admin
      .from("email_templates")
      .select("subject, body_html, body_text, reply_to, is_active")
      .eq("organization_id", params.organizationId)
      .eq("trigger_event", params.triggerEvent)
      .is("deleted_at", null)
      .maybeSingle(),
    admin.auth.admin.getUserById(params.recipientId),
  ]);

  if (templateError) {
    throw new Error(templateError.message);
  }

  if (!template?.is_active) {
    return false;
  }

  const recipientEmail = userResult.data.user?.email;
  if (!recipientEmail) {
    return false;
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: getResendFromEmail(),
    to: recipientEmail,
    subject: mergeTemplate(template.subject, params.variables),
    html: mergeTemplate(template.body_html, params.variables),
    text: template.body_text ? mergeTemplate(template.body_text, params.variables) : undefined,
    replyTo: template.reply_to ?? undefined,
  });

  if (params.notificationId) {
    await appendSentVia(params.notificationId, "email");
  }

  return true;
}

export async function createNotification(params: CreateNotificationParams) {
  const admin = createSupabaseAdminClient();
  const { data: notification, error } = await admin
    .from("notifications")
    .insert({
      organization_id: params.organizationId,
      recipient_id: params.recipientId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      action_url: params.actionUrl ?? null,
      resource_type: params.resourceType ?? null,
      resource_id: params.resourceId ?? null,
      sent_via: ["in_app"],
    })
    .select("id")
    .single();

  if (error || !notification) {
    throw new Error(error?.message ?? "Unable to create notification.");
  }

  if (params.emailTriggerEvent) {
    await sendTemplatedEmail({
      organizationId: params.organizationId,
      recipientId: params.recipientId,
      triggerEvent: params.emailTriggerEvent,
      variables: params.emailVariables ?? {},
      notificationId: notification.id,
    });
  }

  return notification.id;
}
