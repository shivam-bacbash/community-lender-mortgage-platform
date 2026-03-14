"use client";

import { cn } from "@/lib/utils/cn";

function getTone(score: number | null) {
  if (score === null) {
    return "bg-gray-100 text-gray-600";
  }

  if (score >= 70) {
    return "bg-success-25 text-success-700";
  }

  if (score >= 50) {
    return "bg-warning-25 text-warning-700";
  }

  return "bg-error-25 text-error-700";
}

export function AIScoreBadge({
  score,
  recommendation,
}: {
  score: number | null;
  recommendation: string | null;
}) {
  return (
    <span
      title={recommendation ? `AI recommendation: ${recommendation.replaceAll("_", " ")}` : "AI analysis pending"}
      className={cn("rounded-full px-2.5 py-1 font-medium", getTone(score))}
    >
      AI {score ?? "n/a"}
    </span>
  );
}
