import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateHMDAExport } from "@/lib/reports/hmda-export";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (isNaN(year) || year < 2000 || year > 2100) {
    return new Response("Invalid year parameter", { status: 400 });
  }

  const content = await generateHMDAExport(profile.organization_id, year);

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="hmda-lar-${year}.txt"`,
    },
  });
}
