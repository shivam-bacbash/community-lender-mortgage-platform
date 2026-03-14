import { NextResponse } from "next/server";

import { readStaffPipelineData } from "@/lib/staff/queries";

export async function GET() {
  const pipeline = await readStaffPipelineData();
  return NextResponse.json(pipeline);
}
