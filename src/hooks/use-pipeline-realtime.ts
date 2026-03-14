"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { usePipelineStore } from "@/stores/use-pipeline-store";

export function usePipelineRealtime(organizationId: string) {
  const queryClient = useQueryClient();
  const upsertLoan = usePipelineStore((state) => state.upsertLoan);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("pipeline")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loan_applications",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const updated = payload.new as { id: string; pipeline_stage_id?: string | null } | null;

          if (updated?.id) {
            upsertLoan(updated);
          }

          queryClient.invalidateQueries({ queryKey: ["staff-pipeline"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [organizationId, queryClient, upsertLoan]);
}
