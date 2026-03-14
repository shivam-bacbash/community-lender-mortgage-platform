"use client";

import { useEffect, useState } from "react";
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
  const [mountedAt] = useState(() => Date.now());
  const [now, setNow] = useState(mountedAt);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const query = useQuery({
    queryKey: ["loan", loanId],
    queryFn: () => fetchBorrowerLoan(loanId),
    initialData,
    refetchInterval: (query) => {
      if (query.state.data?.prequalification) {
        return false;
      }

      return now - mountedAt < 30_000 ? 3_000 : false;
    },
  });

  return {
    ...query,
    isPollingPrequalification: !query.data?.prequalification && now - mountedAt < 30_000,
  };
}
