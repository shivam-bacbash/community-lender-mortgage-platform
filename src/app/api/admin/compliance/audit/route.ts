import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function toCsvValue(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  let query = admin
    .from("audit_logs")
    .select("id, created_at, actor_id, action, resource_type, resource_id, before_state, after_state")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(500);

  const action = url.searchParams.get("action");
  const resource = url.searchParams.get("resource");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (action) {
    query = query.ilike("action", `%${action}%`);
  }

  if (resource) {
    query = query.ilike("resource_type", `%${resource}%`);
  }

  if (from) {
    query = query.gte("created_at", from);
  }

  if (to) {
    query = query.lte("created_at", `${to}T23:59:59.999Z`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const actorIds = [...new Set((data ?? []).map((row) => row.actor_id).filter(Boolean) as string[])];
  const { data: actors } = actorIds.length
    ? await admin.from("profiles").select("id, first_name, last_name").in("id", actorIds)
    : { data: [] as Array<{ id: string; first_name: string; last_name: string }> };
  const actorMap = new Map((actors ?? []).map((actor) => [actor.id, `${actor.first_name} ${actor.last_name}`.trim()]));

  const csv = [
    ["timestamp", "actor", "action", "resource_type", "resource_id", "before_state", "after_state"].join(","),
    ...(data ?? []).map((row) =>
      [
        toCsvValue(row.created_at),
        toCsvValue(row.actor_id ? actorMap.get(row.actor_id) ?? "System" : "System"),
        toCsvValue(row.action),
        toCsvValue(row.resource_type),
        toCsvValue(row.resource_id),
        toCsvValue(row.before_state),
        toCsvValue(row.after_state),
      ].join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="audit-log.csv"',
    },
  });
}
