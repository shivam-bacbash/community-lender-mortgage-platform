import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils/format";
import { getDocumentTypeLabel } from "@/lib/documents/config";

export function ExpiryAlert({
  items,
}: {
  items: Array<{
    id: string;
    document_type: string;
    file_name: string;
    expires_at: string;
    status: "expiring_soon" | "expired";
  }>;
}) {
  if (!items.length) {
    return null;
  }

  const tone = items.some((item) => item.status === "expired") ? "error" : "info";
  const headline =
    items.length === 1
      ? `${getDocumentTypeLabel(items[0].document_type)} needs attention`
      : `${items.length} documents need attention`;
  const message = items
    .slice(0, 3)
    .map((item) => {
      const statusText = item.status === "expired" ? "expired" : "expires";
      return `${getDocumentTypeLabel(item.document_type)} (${item.file_name}) ${statusText} ${formatDate(item.expires_at)}.`;
    })
    .join(" ");

  return <Alert tone={tone} title={headline} message={message} />;
}
