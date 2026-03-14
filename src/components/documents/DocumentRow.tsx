import Link from "next/link";
import { ExternalLink, GitBranch, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils/format";
import { getDocumentTypeLabel } from "@/lib/documents/config";

export function DocumentRow({
  title,
  documentType,
  createdAt,
  status,
  subtitle,
  version,
  expiresAt,
  previewUrl,
  detailHref,
  extractionConfidence,
  actions,
}: {
  title: string;
  documentType: string;
  createdAt: string;
  status: string;
  subtitle?: string | null;
  version?: number | null;
  expiresAt?: string | null;
  previewUrl?: string | null;
  detailHref?: string | null;
  extractionConfidence?: number | null;
  actions?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600">
            {getDocumentTypeLabel(documentType)} • uploaded {formatDate(createdAt, "MMM d, yyyy h:mm a")}
          </p>
          {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
            {typeof version === "number" ? (
              <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1">
                <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                v{version}
              </span>
            ) : null}
            {typeof extractionConfidence === "number" ? (
              <span className="inline-flex items-center gap-1 rounded bg-primary-50 px-2 py-1 text-primary-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                AI {Math.round(extractionConfidence * 100)}%
              </span>
            ) : null}
            {expiresAt ? (
              <span className="rounded bg-warning-50 px-2 py-1 text-warning-800">
                Expires {formatDate(expiresAt)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700"
            >
              View
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
          {detailHref ? (
            <Link href={detailHref} className="text-sm font-semibold text-gray-700">
              Details
            </Link>
          ) : null}
          {actions}
        </div>
      </div>
    </Card>
  );
}
