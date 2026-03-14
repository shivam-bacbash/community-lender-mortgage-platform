import Link from "next/link";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils/format";

export function VersionHistory({
  versions,
  baseHref,
}: {
  versions: Array<{
    id: string;
    file_name: string;
    version: number;
    created_at: string;
    status: string;
    rejection_reason: string | null;
    is_latest: boolean;
  }>;
  baseHref: string;
}) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900">Version history</h2>
      <div className="mt-4 space-y-3">
        {versions.map((version) => (
          <div
            key={version.id}
            className="flex flex-col gap-2 rounded-2xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">
                v{version.version} {version.is_latest ? "• latest" : ""}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {version.file_name} • uploaded {formatDate(version.created_at, "MMM d, yyyy h:mm a")}
              </p>
              {version.rejection_reason ? (
                <p className="mt-1 text-sm text-error-700">{version.rejection_reason}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={version.status} />
              <Link href={`${baseHref}/${version.id}`} className="text-sm font-semibold text-primary-700">
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
