import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";
import type { DisclosureRecord, TRIDMilestone } from "@/types/compliance";

function ToneIcon({ tone }: { tone: TRIDMilestone["tone"] }) {
  if (tone === "success") {
    return <CheckCircle2 className="h-4 w-4 text-success-600" aria-hidden="true" />;
  }

  if (tone === "warning") {
    return <Clock3 className="h-4 w-4 text-warning-600" aria-hidden="true" />;
  }

  if (tone === "error") {
    return <AlertCircle className="h-4 w-4 text-error-600" aria-hidden="true" />;
  }

  return <Clock3 className="h-4 w-4 text-gray-400" aria-hidden="true" />;
}

export function TRIDTracker({
  milestones,
  disclosures,
}: {
  milestones: TRIDMilestone[];
  disclosures: DisclosureRecord[];
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">TRID timeline</h2>
          <p className="mt-1 text-sm text-gray-500">Business-day tracking for LE and CD milestones.</p>
        </div>
        <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
          {disclosures.length} disclosures
        </p>
      </div>
      <div className="mt-5 space-y-4">
        {milestones.map((milestone) => (
          <div key={milestone.key} className="rounded-2xl border border-gray-200 bg-gray-25 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <ToneIcon tone={milestone.tone} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{milestone.label}</p>
                  <p className="mt-1 text-sm text-gray-600">{milestone.helper}</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                {milestone.due_at ? <p>Due {formatDate(milestone.due_at, "MMM d, yyyy")}</p> : <p>No deadline</p>}
                {milestone.sent_at ? <p>Sent {formatDate(milestone.sent_at, "MMM d, yyyy h:mm a")}</p> : null}
                {milestone.acknowledged_at ? (
                  <p>Acknowledged {formatDate(milestone.acknowledged_at, "MMM d, yyyy h:mm a")}</p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
