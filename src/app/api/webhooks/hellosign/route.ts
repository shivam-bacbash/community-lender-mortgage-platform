import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/service";

type HelloSignEventType =
  | "signature_request_sent"
  | "signature_request_viewed"
  | "signature_request_signed"
  | "signature_request_all_signed"
  | "signature_request_declined"
  | "signature_request_canceled";

type HelloSignPayload = {
  event: {
    event_type: HelloSignEventType;
    event_time: string;
    event_hash: string;
  };
  signature_request: {
    signature_request_id: string;
    subject?: string;
    is_complete?: boolean;
    is_declined?: boolean;
    signing_url?: string;
  };
};

function mapEventToStatus(eventType: HelloSignEventType): string | null {
  switch (eventType) {
    case "signature_request_sent":
      return "sent";
    case "signature_request_viewed":
      return "delivered";
    case "signature_request_signed":
      return "signed";
    case "signature_request_all_signed":
      return "completed";
    case "signature_request_declined":
      return "declined";
    case "signature_request_canceled":
      return "voided";
    default:
      return null;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // HelloSign sends multipart/form-data with a json_data field
  let jsonData: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      jsonData = formData.get("json_data") as string | null;
    } catch {
      return NextResponse.json({ error: "Failed to parse form data." }, { status: 400 });
    }
  } else {
    // Fallback: try JSON body
    jsonData = await req.text();
  }

  if (!jsonData) {
    return NextResponse.json({ error: "Missing json_data." }, { status: 400 });
  }

  let payload: HelloSignPayload;
  try {
    payload = JSON.parse(jsonData);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { event, signature_request } = payload;
  if (!event?.event_type || !signature_request?.signature_request_id) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const mappedStatus = mapEventToStatus(event.event_type);
  if (!mappedStatus) {
    // Unknown event — acknowledge without processing
    return NextResponse.json({ hello: "HelloSign" });
  }

  const admin = createSupabaseAdminClient();

  const { data: envelope, error: fetchError } = await admin
    .from("esign_envelopes")
    .select("id, loan_application_id, status")
    .eq("envelope_id", signature_request.signature_request_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !envelope) {
    // Acknowledge even if not found
    return NextResponse.json({ hello: "HelloSign" });
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
    updates.void_reason = "Cancelled via HelloSign";
  } else if (mappedStatus === "delivered") {
    updates.viewed_at = now;
  }

  await admin
    .from("esign_envelopes")
    .update(updates)
    .eq("id", envelope.id);

  if (mappedStatus === "completed") {
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
        body: `All signers have completed the HelloSign request for loan ${loan.loan_number ?? envelope.loan_application_id}.`,
        resourceType: "loan",
        resourceId: loan.id,
        actionUrl: `/staff/loans/${loan.id}/closing`,
      });
    }
  }

  // HelloSign requires this specific response body
  return NextResponse.json({ hello: "HelloSign" });
}
