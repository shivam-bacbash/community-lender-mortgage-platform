import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/service";

type DocusignStatus =
  | "sent"
  | "delivered"
  | "completed"
  | "declined"
  | "voided";

const STATUS_MAP: Partial<Record<DocusignStatus, string>> = {
  sent: "sent",
  delivered: "delivered",
  completed: "completed",
  declined: "declined",
  voided: "voided",
};

function verifyHmac(body: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expected = hmac.digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const bodyText = await req.text();
  const hmacKey = process.env.DOCUSIGN_HMAC_KEY;

  if (hmacKey) {
    const signature = req.headers.get("x-docusign-signature-1") ?? "";
    if (!verifyHmac(bodyText, signature, hmacKey)) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }
  }

  let payload: { envelopeId?: string; status?: string; event?: string };
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { envelopeId, status } = payload;
  if (!envelopeId || !status) {
    return NextResponse.json({ error: "Missing envelopeId or status." }, { status: 400 });
  }

  const mappedStatus = STATUS_MAP[status as DocusignStatus];
  if (!mappedStatus) {
    // Unknown status — acknowledge without processing
    return NextResponse.json({ ok: true });
  }

  const admin = createSupabaseAdminClient();

  const { data: envelope, error: fetchError } = await admin
    .from("esign_envelopes")
    .select("id, loan_application_id, status")
    .eq("envelope_id", envelopeId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !envelope) {
    // Acknowledge even if not found to avoid webhook retries
    return NextResponse.json({ ok: true });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: mappedStatus,
    webhook_data: payload,
  };

  if (mappedStatus === "completed") {
    updates.completed_at = now;
  } else if (mappedStatus === "voided") {
    updates.voided_at = now;
  }

  await admin
    .from("esign_envelopes")
    .update(updates)
    .eq("id", envelope.id);

  if (mappedStatus === "completed") {
    // Notify the loan officer (look up the loan's assigned LO)
    const { data: loan } = await admin
      .from("loan_applications")
      .select("id, organization_id, loan_officer_id, loan_number")
      .eq("id", envelope.loan_application_id)
      .maybeSingle();

    if (loan?.loan_officer_id) {
      await createNotification({
        organizationId: loan.organization_id,
        recipientId: loan.loan_officer_id,
        type: "esign_completed",
        title: "Signing completed",
        body: `All signers have completed the DocuSign envelope for loan ${loan.loan_number ?? envelope.loan_application_id}.`,
        resourceType: "loan",
        resourceId: loan.id,
        actionUrl: `/staff/loans/${loan.id}/closing`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
