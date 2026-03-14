import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

export function DocumentChecklist({
  title = "Document checklist",
  summary,
  items,
}: {
  title?: string;
  summary: { completed: number; total: number; percent: number };
  items: Array<{
    document_type: string;
    label: string;
    is_complete: boolean;
    latest_status: string | null;
  }>;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {summary.completed} of {summary.total} required documents on file
          </p>
        </div>
        <p className="text-sm font-semibold text-gray-900">{summary.percent}% complete</p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary-600 transition-all"
          style={{ width: `${summary.percent}%` }}
        />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.document_type}
            className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="mt-1 text-xs text-gray-500">
                {item.is_complete ? "Received" : "Still needed"}
              </p>
            </div>
            {item.latest_status ? (
              <StatusBadge status={item.latest_status} />
            ) : (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                Missing
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
