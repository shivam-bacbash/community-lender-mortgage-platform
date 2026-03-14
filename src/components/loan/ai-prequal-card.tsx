import { Sparkles } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils/format";

function scoreTone(score: number) {
  if (score >= 70) {
    return {
      ring: "var(--color-success-500)",
      surface: "bg-success-25 text-success-700",
    };
  }

  if (score >= 50) {
    return {
      ring: "var(--color-warning-500)",
      surface: "bg-warning-25 text-warning-700",
    };
  }

  return {
    ring: "var(--color-error-500)",
    surface: "bg-error-25 text-error-700",
  };
}

export function AIPrequalCard({
  loading,
  score,
  recommendation,
  strengths,
  concerns,
  estimatedDti,
  estimatedLtv,
  rationale,
  disclaimer,
}: {
  loading: boolean;
  score: number | null;
  recommendation: string | null;
  strengths: string[];
  concerns: string[];
  estimatedDti: number | null;
  estimatedLtv: number | null;
  rationale: string | null;
  disclaimer: string;
}) {
  const tone = score !== null ? scoreTone(score) : null;
  const scoreDegrees = score !== null ? Math.min(Math.max(score, 0), 100) * 3.6 : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary-600" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI pre-qualification</h3>
          <p className="text-sm text-gray-600">{disclaimer}</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[140px_1fr]">
          <div className="flex items-center justify-center">
            <Skeleton className="h-28 w-28 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      ) : score !== null && recommendation ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[140px_1fr]">
          <div className="flex flex-col items-center justify-center gap-3">
            <div
              className="grid h-28 w-28 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${tone?.ring ?? "var(--color-gray-300)"} ${scoreDegrees}deg, var(--color-gray-200) ${scoreDegrees}deg)`,
              }}
            >
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-sm">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{score}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Score</p>
                </div>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone?.surface}`}>
              {recommendation.replaceAll("_", " ")}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Assessment summary</p>
              <p className="mt-1 text-sm text-gray-600">{rationale}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Estimated DTI</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {estimatedDti !== null ? formatPercent(estimatedDti) : "N/A"}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Estimated LTV</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {estimatedLtv !== null ? formatPercent(estimatedLtv) : "N/A"}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-success-25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-success-700">Strengths</p>
                <ul className="mt-3 space-y-2 text-sm text-success-900">
                  {strengths.length ? strengths.map((item) => <li key={item}>• {item}</li>) : <li>No strengths captured.</li>}
                </ul>
              </div>
              <div className="rounded-2xl bg-warning-25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-warning-700">Concerns</p>
                <ul className="mt-3 space-y-2 text-sm text-warning-900">
                  {concerns.length ? concerns.map((item) => <li key={item}>• {item}</li>) : <li>No concerns captured.</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-gray-25 p-4">
          <p className="text-sm font-semibold text-gray-900">Pre-qualification pending</p>
          <p className="mt-1 text-sm text-gray-600">
            We are preparing your automated pre-assessment now. Refreshing for up to 30 seconds.
          </p>
        </div>
      )}
    </Card>
  );
}
