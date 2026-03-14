"use server";

import { revalidatePath } from "next/cache";

import { createNotification } from "@/lib/notifications/service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/auth";

const CLOSING_STAFF_ROLES = ["loan_officer", "processor", "underwriter", "admin"] as const;

type StaffContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  profile: {
    id: string;
    organization_id: string;
    role: string;
    first_name: string;
    last_name: string;
  };
};

function getAdminClient() {
  return createSupabaseAdminClient();
}

async function requireStaffContext(): Promise<StaffContext> {
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

  if (profileError || !profile || !CLOSING_STAFF_ROLES.includes(profile.role as typeof CLOSING_STAFF_ROLES[number])) {
    throw new Error("Staff access is required.");
  }

  return { supabase, profile };
}

async function getLoanForStaff(loanId: string, context: StaffContext) {
  const { data, error } = await context.supabase
    .from("loan_applications")
    .select("id, organization_id, borrower_id, loan_number, status")
    .eq("id", loanId)
    .single();

  if (error || !data) {
    throw new Error("Loan application not found.");
  }

  if (data.organization_id !== context.profile.organization_id) {
    throw new Error("You do not have access to this loan.");
  }

  return data;
}

async function writeAuditLog(params: {
  context: StaffContext;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeState?: object;
  afterState?: object;
}) {
  const { context, action, resourceType, resourceId, beforeState, afterState } = params;

  await context.supabase.from("audit_logs").insert({
    organization_id: context.profile.organization_id,
    actor_id: context.profile.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    before_state: beforeState ?? {},
    after_state: afterState ?? {},
  });
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function revalidateClosingPaths(loanId: string) {
  revalidatePath(`/staff/loans/${loanId}/closing`);
  revalidatePath(`/staff/loans/${loanId}`);
}

export type ScheduleClosingData = {
  title_company_name?: string;
  title_company_phone?: string;
  settlement_agent?: string;
  settlement_agent_email?: string;
  closing_date?: string;
  closing_location_type?: "in_person" | "remote" | "hybrid";
  closing_address?: string;
  video_link?: string;
  notes?: string;
};

export async function scheduleClosing(
  loanId: string,
  data: ScheduleClosingData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireStaffContext();
    const loan = await getLoanForStaff(loanId, context);

    const closingLocation: Record<string, string | undefined> = {
      type: data.closing_location_type,
    };
    if (data.closing_address) {
      closingLocation.address = data.closing_address;
    }
    if (data.video_link) {
      closingLocation.video_link = data.video_link;
    }

    // Check for existing closing order
    const { data: existing } = await context.supabase
      .from("closing_orders")
      .select("id, status")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .maybeSingle();

    const admin = getAdminClient();

    let closingOrderId: string;

    if (existing) {
      const { data: updated, error: updateError } = await admin
        .from("closing_orders")
        .update({
          title_company_name: data.title_company_name ?? null,
          title_company_phone: data.title_company_phone ?? null,
          settlement_agent: data.settlement_agent ?? null,
          settlement_agent_email: data.settlement_agent_email ?? null,
          closing_date: data.closing_date ? new Date(data.closing_date).toISOString() : null,
          closing_location: closingLocation,
          notes: data.notes ?? null,
          status: "scheduled",
          updated_by: context.profile.id,
        })
        .eq("id", existing.id)
        .select("id")
        .single();

      if (updateError || !updated) {
        return { data: null, error: updateError?.message ?? "Failed to update closing order." };
      }
      closingOrderId = updated.id;
    } else {
      const { data: inserted, error: insertError } = await admin
        .from("closing_orders")
        .insert({
          loan_application_id: loanId,
          ordered_by: context.profile.id,
          title_company_name: data.title_company_name ?? null,
          title_company_phone: data.title_company_phone ?? null,
          settlement_agent: data.settlement_agent ?? null,
          settlement_agent_email: data.settlement_agent_email ?? null,
          closing_date: data.closing_date ? new Date(data.closing_date).toISOString() : null,
          closing_location: closingLocation,
          notes: data.notes ?? null,
          status: "scheduled",
          created_by: context.profile.id,
          updated_by: context.profile.id,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        return { data: null, error: insertError?.message ?? "Failed to create closing order." };
      }
      closingOrderId = inserted.id;
    }

    await writeAuditLog({
      context,
      action: "closing.scheduled",
      resourceType: "closing_order",
      resourceId: closingOrderId,
      afterState: { status: "scheduled", closing_date: data.closing_date },
    });

    await createNotification({
      organizationId: context.profile.organization_id,
      recipientId: loan.borrower_id,
      type: "closing_scheduled",
      title: "Your closing has been scheduled",
      body: data.closing_date
        ? `Your closing is scheduled for ${new Date(data.closing_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
        : "Your loan closing has been scheduled. Your loan officer will provide more details.",
      resourceType: "loan",
      resourceId: loanId,
      actionUrl: `/loans/${loanId}`,
    });

    revalidateClosingPaths(loanId);

    return { data: { id: closingOrderId }, error: null };
  } catch (e) {
    return { data: null, error: normalizeError(e) };
  }
}

export async function sendForEsign(
  loanId: string,
  signingEvent: "initial_disclosures" | "loan_estimate" | "closing_docs",
): Promise<ActionResult<{ id: string; envelope_id: string }>> {
  try {
    const context = await requireStaffContext();
    const loan = await getLoanForStaff(loanId, context);

    const mockEnvelopeId = `MOCK-ENV-${Date.now()}`;

    const { data: envelope, error: envelopeError } = await getAdminClient()
      .from("esign_envelopes")
      .insert({
        loan_application_id: loanId,
        created_by_profile: context.profile.id,
        provider: "docusign",
        envelope_id: mockEnvelopeId,
        signing_event: signingEvent,
        status: "sent",
        sent_at: new Date().toISOString(),
        created_by: context.profile.id,
        updated_by: context.profile.id,
      })
      .select("id, envelope_id")
      .single();

    if (envelopeError || !envelope) {
      return { data: null, error: envelopeError?.message ?? "Failed to create e-sign envelope." };
    }

    await writeAuditLog({
      context,
      action: "closing.esign_sent",
      resourceType: "esign_envelope",
      resourceId: envelope.id,
      afterState: { envelope_id: mockEnvelopeId, signing_event: signingEvent, status: "sent" },
    });

    await createNotification({
      organizationId: context.profile.organization_id,
      recipientId: loan.borrower_id,
      type: "esign_requested",
      title: "Documents ready to sign",
      body: `Your ${signingEvent.replaceAll("_", " ")} documents are ready for your electronic signature.`,
      resourceType: "loan",
      resourceId: loanId,
      actionUrl: `/loans/${loanId}`,
    });

    revalidateClosingPaths(loanId);

    return { data: { id: envelope.id, envelope_id: envelope.envelope_id }, error: null };
  } catch (e) {
    return { data: null, error: normalizeError(e) };
  }
}

export async function updateFundingChecklist(
  closingOrderId: string,
  checkedItems: string[],
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireStaffContext();

    // Verify the closing order belongs to a loan in this org
    const { data: order, error: orderError } = await context.supabase
      .from("closing_orders")
      .select("id, loan_application_id")
      .eq("id", closingOrderId)
      .is("deleted_at", null)
      .single();

    if (orderError || !order) {
      return { data: null, error: "Closing order not found." };
    }

    // Merge checklist into wire_instructions jsonb
    const { data: updated, error: updateError } = await getAdminClient()
      .from("closing_orders")
      .update({
        wire_instructions: { checklist: checkedItems },
        updated_by: context.profile.id,
      })
      .eq("id", closingOrderId)
      .select("id")
      .single();

    if (updateError || !updated) {
      return { data: null, error: updateError?.message ?? "Failed to update checklist." };
    }

    revalidateClosingPaths(order.loan_application_id);

    return { data: { id: updated.id }, error: null };
  } catch (e) {
    return { data: null, error: normalizeError(e) };
  }
}

export async function markFunded(
  loanId: string,
  closingOrderId: string,
  fundingAmount: number,
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireStaffContext();
    const loan = await getLoanForStaff(loanId, context);

    const admin = getAdminClient();

    const { data: updatedOrder, error: orderError } = await admin
      .from("closing_orders")
      .update({
        status: "funded",
        funded_at: new Date().toISOString(),
        funding_amount: fundingAmount,
        updated_by: context.profile.id,
      })
      .eq("id", closingOrderId)
      .select("id")
      .single();

    if (orderError || !updatedOrder) {
      return { data: null, error: orderError?.message ?? "Failed to update closing order." };
    }

    const { error: loanError } = await admin
      .from("loan_applications")
      .update({ status: "funded" })
      .eq("id", loanId);

    if (loanError) {
      return { data: null, error: loanError.message };
    }

    await writeAuditLog({
      context,
      action: "closing.funded",
      resourceType: "closing_order",
      resourceId: closingOrderId,
      afterState: { status: "funded", funding_amount: fundingAmount },
    });

    await createNotification({
      organizationId: context.profile.organization_id,
      recipientId: loan.borrower_id,
      type: "loan_funded",
      title: "Your loan has been funded",
      body: "Congratulations! Your loan has been funded. Funds will be disbursed per your closing instructions.",
      resourceType: "loan",
      resourceId: loanId,
      actionUrl: `/loans/${loanId}`,
    });

    revalidatePath("/staff/dashboard");
    revalidatePath("/staff/pipeline");
    revalidateClosingPaths(loanId);

    return { data: { id: updatedOrder.id }, error: null };
  } catch (e) {
    return { data: null, error: normalizeError(e) };
  }
}

export async function voidEsignEnvelope(
  envelopeId: string,
  reason: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireStaffContext();

    // Verify this envelope belongs to a loan in this org
    const { data: envelope, error: fetchError } = await context.supabase
      .from("esign_envelopes")
      .select("id, loan_application_id, envelope_id, status")
      .eq("id", envelopeId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !envelope) {
      return { data: null, error: "E-sign envelope not found." };
    }

    const { data: updated, error: updateError } = await getAdminClient()
      .from("esign_envelopes")
      .update({
        status: "voided",
        voided_at: new Date().toISOString(),
        void_reason: reason,
        updated_by: context.profile.id,
      })
      .eq("id", envelopeId)
      .select("id")
      .single();

    if (updateError || !updated) {
      return { data: null, error: updateError?.message ?? "Failed to void envelope." };
    }

    await writeAuditLog({
      context,
      action: "closing.esign_voided",
      resourceType: "esign_envelope",
      resourceId: envelopeId,
      beforeState: { status: envelope.status },
      afterState: { status: "voided", void_reason: reason },
    });

    revalidateClosingPaths(envelope.loan_application_id);

    return { data: { id: updated.id }, error: null };
  } catch (e) {
    return { data: null, error: normalizeError(e) };
  }
}
