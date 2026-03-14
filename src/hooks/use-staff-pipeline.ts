"use client";

import { useQuery } from "@tanstack/react-query";

import type { StaffPipelineData } from "@/types/staff";

async function fetchStaffPipeline() {
  const response = await fetch("/api/staff/pipeline", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to load pipeline data.");
  }

  return (await response.json()) as StaffPipelineData;
}

export function useStaffPipeline(initialData: StaffPipelineData) {
  return useQuery({
    queryKey: ["staff-pipeline"],
    queryFn: fetchStaffPipeline,
    initialData,
  });
}
