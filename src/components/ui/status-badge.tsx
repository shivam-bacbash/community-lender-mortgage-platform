import { cn } from "@/lib/utils/cn";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-primary-50 text-primary-700",
  processing: "bg-warning-50 text-warning-700",
  underwriting: "bg-warning-100 text-warning-800",
  approved: "bg-success-50 text-success-700",
  clear_to_close: "bg-success-100 text-success-800",
  funded: "bg-success-500 text-white",
  denied: "bg-error-50 text-error-700",
  withdrawn: "bg-gray-100 text-gray-500",
  cancelled: "bg-gray-100 text-gray-500",
  pending: "bg-gray-100 text-gray-600",
  under_review: "bg-warning-50 text-warning-700",
  accepted: "bg-success-50 text-success-700",
  rejected: "bg-error-50 text-error-700",
  expired: "bg-error-100 text-error-800",
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize transition-transform duration-200",
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {formatStatus(status)}
    </span>
  );
}
