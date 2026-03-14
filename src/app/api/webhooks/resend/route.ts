export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  return Response.json({
    received: true,
    event: payload?.type ?? "unknown",
  });
}
