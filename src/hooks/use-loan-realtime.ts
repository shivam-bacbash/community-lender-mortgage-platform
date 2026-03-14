"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function useLoanRealtime(loanId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`loan:${loanId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "loan_applications",
          filter: `id=eq.${loanId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
          queryClient.invalidateQueries({ queryKey: ["borrower-loans"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loanId, queryClient]);
}
