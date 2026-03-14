import { NextResponse } from "next/server";

import { readBorrowerLoanDetails } from "@/lib/borrower/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const loan = await readBorrowerLoanDetails(id);

  if (!loan) {
    return NextResponse.json({ error: "Loan not found." }, { status: 404 });
  }

  return NextResponse.json(loan);
}
