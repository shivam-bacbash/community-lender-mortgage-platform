"use client";

import { useQuery } from "@tanstack/react-query";

import type { BorrowerLoanDetails } from "@/types/borrower";

async function fetchBorrowerLoan(loanId: string) {
  const response = await fetch(`/api/borrower/loans/${loanId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to load the loan details.");
  }

  return (await response.json()) as BorrowerLoanDetails;
}

export function useBorrowerLoan(loanId: string, initialData: BorrowerLoanDetails) {
  return useQuery({
    queryKey: ["loan", loanId],
    queryFn: () => fetchBorrowerLoan(loanId),
    initialData,
  });
}
